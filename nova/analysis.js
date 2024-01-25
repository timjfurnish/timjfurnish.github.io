//==============================================
// Part of NOVA - NOVel Assistant
// Tim Furnish, 2023-2024
//==============================================

var g_sentences = null
var g_headingToSentence = null
var g_numInputBoxes = 0

const kIllegalSubstrings = [["tab character", "\t"], ["double apostrophe", "''"], ["double quote", "\"\""], ["double space", "  "], ["dubious punctuation combo", /[;:,\.\!\?][;:,\.]/g], ["split infinitive", / to [a-z]+ly /i]]
const kIllegalSubstringsExceptions = {[" to apply "]:true}
const kValidFinalCharactersSpeech = MakeSet("\u2026", ".", "!", "?", "\u2014")
const kValidFinalCharactersNarrative = MakeSet("\u2026", ".", "!", "?")

function SetUp_FixTitle()
{
	const location = document.location.href

	if (location.substr(0, 4) == "file")
	{
		document.title += " (LOCAL)"
	}
}

function SetUp()
{
	CallTheseFunctions([BuildTabs, SetUp_FixTitle, SettingsLoad])

	for (var i = 0; i < g_tweakableSettings.numTextBoxes; ++ i)
	{
		addInputBox(false)
	}

	ShowContentForSelectedTab()
	setTimeout(ProcessInput, 0)
}

function addInputBox(saveIt)
{
	document.getElementById('inputs').innerHTML += '<textarea id="txtIn' + ++ g_numInputBoxes + '" cols=110 rows=10 onChange="ProcessInput()"></textarea><BR>'
	
	if (saveIt)
	{
		SettingUpdate('numTextBoxes', g_numInputBoxes)
	}
}

function mergeInputBoxes()
{
	const contents = GetInputTextRaw()

	document.getElementById('inputs').innerHTML = ''
	g_numInputBoxes = 0
	addInputBox(true)
	
	document.getElementById('txtIn1').value = contents
}

function hideShowInputs(checked)
{
	document.getElementById('inputsControls').style.display = checked ? '' : 'none'
	document.getElementById('inputs').style.display = checked ? "block" : "none"
}

function CheckParagraphForIssues(txtIn)
{
	txtIn = txtIn.replace(/[\(\)]/g, '')

	for (var [k,v] of kIllegalSubstrings)
	{
		const changed = txtIn.replace(v, matched => (matched in kIllegalSubstringsExceptions) ? matched : Highlighter(matched))
		if (changed != txtIn)
		{
			IssueAdd("Found " + k + " in '" + changed + "'", k.toUpperCase())
		}
	}
	
	const splittyFun = txtIn.split(/[\.,!\?]+"*/)
	splittyFun.shift()
	for (var each of splittyFun)
	{
		if (each && ! each.startsWith(' ') && ! each.startsWith("'"))
		{
			IssueAdd("Found punctuation not followed by space before '" + each + "' in '" + txtIn + "'")
		}
	}
}

function CheckEachWord(wordList, s, workspace, gatherHere)
{
	for (word of wordList)
	{
		if (word)
		{
			if (word in workspace.badWords)
			{
				IssueAdd("Found disallowed word '" + word + "' in '" + s + "'")
			}
			else if (word == "todo")
			{
				workspace.foundToDo = true
				workspace.foundToDoInParagraph = true
				if (workspace.percentComplete >= 100)
				{
					IssueAdd("Chapter complete but contains a TODO in '" + s + "'", "TODO")
				}
			}
			else if (word.length < g_tweakableSettings.allowNumbersWithThisManyDigits)
			{
				if (parseInt(word) + "" == word)
				{
					IssueAdd("Found number '" + word + "' in '" + s + "'", "NUMBERS")
				}
			}

			if (gatherHere)
			{
				const name = g_nameLookup[word]
				if (name)
				{
					Tally(gatherHere.mentions, name)
				}
			}
		}
	}
}

function GetInputTextRaw()
{
	var reply = []

	for (var n = 1; n <= g_numInputBoxes; ++ n)
	{
		reply.push(document.getElementById('txtIn' + n).value.trim())
	}
	
	return reply.join('\n')
}

function GetInputText()
{
	var reply = GetInputTextRaw()

	reply = reply.replace(/[\u201C\u201D]/g, '"')
	reply = reply.replace(/[\u2018\u2019]/g, "'")
	reply = reply.replace(/([0-9])\.([0-9])/g, "$1^$2")
	reply = reply.replace(/Dr\./g, 'Dr^')
	reply = reply.replace(/Mr\./g, 'Mr^')
	reply = reply.replace(/Mrs\./g, 'Mrs^')
	reply = reply.replace(/O\.S\./g, 'O^S^')
	reply = reply.replace(/i\.e\./g, 'i^e^')
	reply = reply.replace(/e\.g\./g, 'e^g^')
	reply = reply.replace(/[<>]/g, '')
	reply = reply.replace(/:\n([^\n])/g, ': $1')
	
	return reply.split(/[\n\t]+/)
}

function ShouldIgnorePara(txtInProcessed)
{
	if (txtInProcessed === "" || txtInProcessed === "" + Number(txtInProcessed) || SettingsSayShouldIgnore(txtInProcessed))
	{
		return true
	}

	if (txtInProcessed[0] == '#')
	{
		MetaDataSet(...txtInProcessed.substring(1).split(':'))
		return true
	}
	else if (txtInProcessed[0] == '@')
	{
		WarningEnableDisable(txtInProcessed.substring(1))
		return true
	}
	
	return false
}

function CheckStartsWithCapital(w, reason, s)
{
	const letter = w[0]

	if (letter == letter.toLowerCase())
	{
		IssueAdd("Expected '" + w + "' to start with a capital letter " + (reason ?? "because it's capitalised in settings in") + " '" + s + "'", "CAPITALS")
	}
}

function ProcessInput()
{
	g_sentences = []
	g_headingToSentence = []
	
	DoEvent("clear")

	const kSpecificOnlyAHeadingIfIncludes = g_tweakableSettings.headingIdentifier

	var gatherHeadingStatsHere = null
	
	var workspace =
	{
		stillLookingForChapterNameInChapter:null,
		lastHeading:null,
		badWords:{}
	}
	
	for (var w of g_tweakableSettings.badWords.split(" "))
	{
		workspace.badWords[w] = true
	}

	for (txtInRaw of GetInputText())
	{
		try
		{
			txtInRaw.startsWith(" ") && IssueAdd("Found leading space in '" + txtInRaw + "'", "LEADING SPACE")
			txtInRaw.endsWith(" ") && IssueAdd("Found trailing space in '" + txtInRaw + "'", "TRAILING SPACE")

			const txtInProcessed = txtInRaw.replace(/[\.\!\?;=]+ */g, '|')./*replace(/\u2026/g, '|').*/replace(/:$/, '').replace(/\|$/, '').replace(/^\|/, '').replace(/\^/g, '.')

			if (ShouldIgnorePara(txtInProcessed))
			{
				continue
			}

			const isAHeading = txtInProcessed.length <= g_tweakableSettings.headingMaxCharacters && (kSpecificOnlyAHeadingIfIncludes ? txtInProcessed.includes(kSpecificOnlyAHeadingIfIncludes) : (txtInProcessed == txtInRaw))

			if (!isAHeading)
			{
				workspace.foundTextBetweenHeadings = true

				MentionsStoreParagraph(txtInRaw)
				CheckParagraphForIssues(txtInRaw)

				const talkyNonTalky = txtInProcessed.split('"')

				if ((talkyNonTalky.length & 1) == 0)
				{
					IssueAdd("Found odd number of quotation marks in '" + txtInRaw + "'", "UNFINISHED QUOTE")
				}
				
				var isSpeech = true
				var shouldStartWithCapital = "at the start of"
				var finalCharacter = ""
				var endedWithSpeech = false

				for (var each of talkyNonTalky)
				{
					var txtIn = each.trim()
					isSpeech = !isSpeech

					if (isSpeech)
					{
						if (! txtIn)
						{
							IssueAdd("Found empty speech in '" + txtInRaw + "'")
						}
						else if (each != txtIn)
						{
							IssueAdd("Found white space at beginning and/or end of speech: '" + each + "'")
						}
					}

					if (!txtIn)
					{
						continue
					}

					const sentences = OnlyKeepValid(txtIn.split("|"))
					const numSentences = sentences.length

					if (numSentences)
					{
						if (workspace.stillLookingForChapterNameInChapter)
						{
							const putBackTogether = sentences.join(' ').toLowerCase()
							if (putBackTogether.includes(workspace.stillLookingForChapterNameInChapter))
							{
								workspace.stillLookingForChapterNameInChapter = null
							}
						}

						MetaDataProcessParagraph(numSentences)

						if (gatherHeadingStatsHere)
						{
							++ gatherHeadingStatsHere.numPara
							gatherHeadingStatsHere.numSentences += numSentences
						}

						if (workspace.lastHeading)
						{
							gatherHeadingStatsHere = {txt:workspace.lastHeading, startsAt:g_sentences.length, numPara:0, numSentences:0, numWords:0, mentions:{}}
							g_headingToSentence.push(gatherHeadingStatsHere)
							g_sentences.push({heading:true, text:workspace.lastHeading, listOfWords:[]})
							workspace.lastHeading = null
						}
						
						var numWordsInPara = 0
						var prefixMe = '^'

						for (var s of sentences)
						{
							// Allow paragraphs to start with things like "... and a hamster," he finished.
							if (shouldStartWithCapital && isSpeech && s[0] == "\u2026")
							{
								shouldStartWithCapital = false
							}
							
							// If we're in SCRIPT mode then allow paragraphs like "(whispered)"
							if (! g_disabledWarnings.SCRIPT && !isSpeech && s[0] == '(')
							{
								shouldStartWithCapital = false
							}

							s = s.replace(/^'+/, "").replace(/'+$/, "")
							const listOfWords = OnlyKeepValid(s.split(/[^\-%#'a-zA-Z0-9\&]+/))

							if (listOfWords.length)
							{
								CheckIfLongest("sentence", listOfWords.length, s)
								CheckIfLongest("sentenceChr", listOfWords.join(' ').length, s)

								numWordsInPara += listOfWords.length
								MetaDataAddWordCount(listOfWords.length, isSpeech)
								
								if (gatherHeadingStatsHere)
								{
									gatherHeadingStatsHere.numWords += listOfWords.length
								}

								var newListOfWords = []
								for (var wIn of listOfWords)
								{
									var w = wIn.replace(/^'+/, "").replace(/'+$/, "")
									if (w)
									{
										if (shouldStartWithCapital) // TODO: or if a name
										{
											CheckStartsWithCapital(w, shouldStartWithCapital, s)
										}

										w = w.toLowerCase()

										shouldStartWithCapital = ["mr", "dr", "mrs"].includes(w) && ("following " + w + " in")
										
										newListOfWords.push(w)
										CheckEachWord(w.split(/[-']/), s, workspace, gatherHeadingStatsHere)
									}
									else
									{
										IssueAdd("Empty word in '" + s + "'")
									}
								}
								
//								console.log("[" + s + "] => [" + listOfWords + "] => [" + newListOfWords + "]")
								g_sentences.push({text:prefixMe + s, isSpeech:isSpeech, listOfWords:newListOfWords})
								prefixMe = ''
							}
						}

						CheckIfLongest("paraSentences", numSentences, sentences)
						CheckIfLongest("paraWords", numWordsInPara, sentences)
						CheckIfLongest("paraChr", txtIn.length, sentences)
					}
				}
				
				if (g_disabledWarnings.SCRIPT && !workspace.foundToDoInParagraph)
				{
					CheckFinalCharacter(txtInRaw)
				}
				
				delete workspace.foundToDoInParagraph
			}
			else
			{
				DoEndOfChapterChecks(workspace)
				IssueSetHeading(txtInRaw)
				MentionsStoreHeading(txtInRaw)

				const justChapterName = txtInRaw.split(/ *[\[\(]/)[0]

				workspace.percentComplete = parseInt(txtInRaw.split('[')[1] ?? "100")
				workspace.lastHeading = txtInRaw
//				console.log("Chapter " + workspace.lastHeading + " says it's " + workspace.percentComplete + "% complete")
				workspace.stillLookingForChapterNameInChapter = justChapterName.toLowerCase()
				MetaDataSet("CHAPTER", justChapterName)
				delete workspace.foundTextBetweenHeadings
			}
		}
		catch(error)
		{
			ShowError("While parsing " + txtInRaw + ":\n\n" + error.stack)
		}
	}
	
	DoEndOfChapterChecks(workspace)
	
	DoEvent("processingDone")

	SetSentenceNum(0)
	
	if (g_selectedTabName != 'settings')
	{
		ShowContentForSelectedTab()
	}
}

function CheckFinalCharacter(txtIn)
{
	const txtFull = txtIn
	var finalCharacter = txtIn.slice(-1)
	var endsWithSpeech = false

	while (finalCharacter == '"' || finalCharacter == ')')
	{
		if (finalCharacter == '"')
		{
			if (endsWithSpeech)
			{
				break
			}

			endsWithSpeech = true
		}
		
		txtIn = txtIn.slice(0, -1)
		finalCharacter = txtIn.slice(-1)
	}

	const checkHere = endsWithSpeech ? kValidFinalCharactersSpeech : kValidFinalCharactersNarrative
	if (! (finalCharacter in checkHere))
	{
		IssueAdd("Final important character of '" + txtFull + "' is '" + finalCharacter + "' (valid=" + Object.keys(checkHere).join("") + ")", "INVALID FINAL CHARACTER")
	}
}

function DoEndOfChapterChecks(workspace)
{
	if (workspace.percentComplete < 100 && !workspace.foundToDo)
	{
		IssueAdd("Chapter is incomplete but contains no TODO", "TODO")
	}

	if (workspace.stillLookingForChapterNameInChapter && workspace.foundTextBetweenHeadings)
	{
		IssueAdd("Didn't find chapter name in chapter '" + workspace.stillLookingForChapterNameInChapter + "'", "CHAPTER NAME IN CHAPTER")
	}
	
	delete workspace.foundToDo
}

