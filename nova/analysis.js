//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_sentences = null
var g_headingToSentence = null

const kIllegalSubstrings =
[
	["tab character", "\t"],
	["double apostrophe", "''"],
	["misused hyphen", /( \-)|(\- )/g],
	["double quote", "\"\""],
	["double space", "  "],
	["dubious punctuation combo", /[;:,\.\!\?][;:,\.\!\?]/g],
	["space before punctuation", / [;:,\.\!\?]/g],
	["split infinitive", /\bto [a-z]+ly /gi]
]
const kIllegalSubstringsExceptions = MakeSet("to apply ", "!?")
const kValidFinalCharactersSpeech = MakeSet(kCharacterElipsis, ".", "!", "?", "\u2014", "'")
const kValidFinalCharactersNarrative = MakeSet(kCharacterElipsis, ".", "!", "?", ":")

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
	CallTheseFunctions(BuildTabs, SetUp_FixTitle, SettingsLoad, AddAllInputBoxes, ShowContentForSelectedTab, ProcessInput)
}

function CheckParagraphForIssues(txtIn, txtInProcessed)
{
	if (! g_tweakableSettings.allowedStartCharacters.includes(txtIn[0].toUpperCase()))
	{
		IssueAdd("First character of " + FixStringHTML(txtIn) + " is not an allowed start character " + FixStringHTML(g_tweakableSettings.allowedStartCharacters), "ILLEGAL START CHARACTER")
	}		

	txtIn = txtIn.replace(/[\(\)]/g, '')

	for (var [k,v] of kIllegalSubstrings)
	{
		const changed = txtIn.replace(v, matched => (matched in kIllegalSubstringsExceptions) ? matched : Highlighter(matched))
		if (changed != txtIn)
		{
			IssueAdd("Found " + k + " in " + FixStringHTML(changed), k.toUpperCase())
		}
	}
	
	const splittyFun = txtInProcessed.split(/[\.,!\?]+["\)]?/)
	splittyFun.shift()
	for (var each of splittyFun)
	{
		if (each && ! each.startsWith(' ') && ! each.startsWith("'"))
		{
			IssueAdd("Found punctuation not followed by space before " + FixStringHTML(each) + " in " + FixStringHTML(txtIn), "PUNCTUATION WITHOUT SPACE")
		}
	}
}

function CheckEachWord(word, s, workspace, gatherHere)
{
	// TODO: This catches things like 1234 and -10 but not 2.4 or E3
	if (word.length < g_tweakableSettings.allowNumbersWithThisManyDigits)
	{
		if (parseInt(word) + "" == word)
		{
			IssueAdd("Found number " + FixStringHTML(word) + " in " + FixStringHTML(s), "NUMBERS")
		}
	}

	const wordLower = word.toLowerCase()

	if (wordLower in workspace.badWords)
	{
		IssueAdd("Found disallowed word " + FixStringHTML(word) + " in " + FixStringHTML(s), "DISALLOWED WORD")
	}
	else if (wordLower == "todo")
	{
		workspace.foundToDo = true
		workspace.foundToDoInParagraph = true
		if (workspace.percentComplete >= 100)
		{
			IssueAdd("Chapter complete but contains a TODO in " + FixStringHTML(s), "TODO")
		}
	}

	const name = g_nameLookup[wordLower]

	if (name)
	{
		if (! (word in g_permittedNameCapitalisations))
		{
			IssueAdd("Check capitalisation of " + FixStringHTML(word) + " in "  + FixStringHTML(s), "CAPITALS")			
		}
		
		if (gatherHere)
		{
			Tally(gatherHere.mentionedInThisChapter, name)
		}
	}
	
	const lastApostrophe = word.lastIndexOf("'")
	if (lastApostrophe > 0)
	{
		CheckEachWord(word.substr(0, lastApostrophe), s, workspace, gatherHere)
		return false
	}
	
	return ["mr.", "dr.", "mrs."].includes(wordLower)
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
		IssueAdd("Expected " + FixStringHTML(w) + " to start with a capital letter " + (reason ?? "because it's capitalised in settings in") + " " + FixStringHTML(s), "CAPITALS")
	}
}

function HandleNewHeading(workspace, txtInRaw)
{
	if (g_tweakableSettings.headingIdentifier)
	{
		if (txtInRaw.length <= g_tweakableSettings.headingMaxCharacters)
		{
			if (txtInRaw.includes(g_tweakableSettings.headingIdentifier))
			{
				DoEndOfChapterChecks(workspace)
				MentionsStoreHeading(txtInRaw)

				const justChapterName = txtInRaw.split(/ *[\[\(]/)[0]

				workspace.percentComplete = parseInt(txtInRaw.split('[')[1] ?? "100")
				workspace.lastHeading = txtInRaw
				workspace.stillLookingForChapterNameInChapter = justChapterName.toLowerCase()
				MetaDataSet("CHAPTER", justChapterName)

				delete workspace.foundTextBetweenHeadings
				return true
			}
		}
	}
	
	return false
}

function EscapeRegExSpecialChars(txtIn)
{
	const txtOut = txtIn.replace(/[.*+?^${}()|[\]\\\-]/g, "\\$&")
//	console.log("BEFORE: " + txtIn)
//	console.log("AFTER:  " + txtOut)
	return txtOut
}

function ProcessInput()
{
	g_sentences = []
	g_headingToSentence = []
	
	DoEvent("clear")

	var gatherHeadingStatsHere = null
	
	var workspace =
	{
		stillLookingForChapterNameInChapter:null,
		lastHeading:null,
		badWords:{},
		replaceRules:[],
		regexForRemovingValidChars:new RegExp('[' + EscapeRegExSpecialChars(g_tweakableSettings.allowedCharacters) + ']', 'g')
	}
	
	for (var w of g_tweakableSettings.badWords.split(" "))
	{
		workspace.badWords[w] = true
	}

	for (var ruleText of g_tweakableSettings.replace)
	{
		const bits = ruleText.split('/', 3)
		if (bits[0])
		{
			if (bits.length >= 2)
			{
				try
				{
					workspace.replaceRules.push({regex:new RegExp(bits[0], 'g' + (bits[2] ?? '')), replaceWith:bits[1] ?? ''})
				}
				catch
				{
					IssueAdd("Replace rule " + FixStringHTML(ruleText) + " is invalid")
				}					
			}
			else
			{
				IssueAdd("Replace rule " + FixStringHTML(ruleText) + " doesn't specify what to turn " + FixStringHTML(bits[0]) + " into")
			}
		}
	}

	for (txtInRaw of GetInputText())
	{
		try
		{
			txtInRaw.startsWith(" ") && IssueAdd("Found leading space in " + FixStringHTML(txtInRaw), "LEADING SPACE")
			txtInRaw.endsWith(" ") && IssueAdd("Found trailing space in " + FixStringHTML(txtInRaw), "TRAILING SPACE")

			if (! ShouldIgnorePara(txtInRaw) && ! HandleNewHeading(workspace, txtInRaw))
			{
				var txtInProcessed = txtInRaw
				
				for (var rule of workspace.replaceRules)
				{
//					const prev = txtInProcessed

					txtInProcessed = txtInProcessed.replace(rule.regex, rule.replaceWith)

/*
					if (txtInProcessed != prev)
					{
						console.log("Using custom replace rule '" + rule.regex + "' we turned '" + prev + "' into '" + txtInProcessed + "'")
					}
*/
				}

				workspace.foundTextBetweenHeadings = true

				MentionsStoreParagraph(txtInRaw)
				CheckParagraphForIssues(txtInRaw, txtInProcessed)

				const talkyNonTalky = txtInProcessed.split('"')

				if ((talkyNonTalky.length & 1) == 0)
				{
					IssueAdd("Found odd number of quotation marks in " + FixStringHTML(txtInRaw), "UNFINISHED QUOTE")
				}
				
				var isSpeech = true
				var shouldStartWithCapital = "at the start of"
				var processedSomething = false

				for (var eachIn of talkyNonTalky)
				{
					const each = eachIn.replace(/[\(\)]/g, '').replace(/[\.\!\?;:=]+ */g, '|').replace(/\|$/, '').replace(/\^/g, '.')

					var txtIn = each.trim()
					isSpeech = !isSpeech

					if (isSpeech)
					{
						if (! txtIn)
						{
							IssueAdd("Found empty speech in " + FixStringHTML(txtInRaw), "EMPTY SPEECH")
						}
						else if (each != txtIn)
						{
							IssueAdd("Found white space at beginning and/or end of speech: " + FixStringHTML(each), "SPACE IN SPEECH")
						}
					}

					if (!txtIn)
					{
						continue
					}

					// If we're in SCRIPT mode then allow paragraphs like "(whispered)"
					if (! g_disabledWarnings.SCRIPT && !isSpeech && eachIn[0] == '(')
					{
						shouldStartWithCapital = false
					}

					const sentences = txtIn.split("|")
					const numSentences = sentences.length
					var expectNextBitToDoSomething = isSpeech
					var lastSentenceThatDidSomething = "at start of"

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
							gatherHeadingStatsHere = {txt:workspace.lastHeading, startsAt:g_sentences.length, numPara:0, numSentences:0, numWords:0, mentionedInThisChapter:{}}
							g_headingToSentence.push(gatherHeadingStatsHere)
							g_sentences.push({heading:true, text:workspace.lastHeading/*, listOfWords:[]*/})
							workspace.lastHeading = null
						}
						
						for (var s of sentences)
						{
							var sentenceDidSomething = false
							const oldNumIssues = IssueGetTotal()

							// Allow paragraphs to start with things like "... and a hamster," he finished.
							if (shouldStartWithCapital && isSpeech && s[0] == kCharacterElipsis)
							{
								shouldStartWithCapital = false
							}

							const remains = s.replace(workspace.regexForRemovingValidChars, '')
							if (remains != '')
							{
								IssueAdd("Characters " + FixStringHTML(remains) + " found in " + FixStringHTML(s), "ILLEGAL CHARACTERS")
							}
							
							s = s.replace(/^'+/, "").replace(/'+$/, "")
							const myListOfWords = OnlyKeepValid(s.split(/[^\-\.%#'a-zA-Z0-9\&]+/))

							if (myListOfWords.length)
							{
								CheckIfLongest("sentence", myListOfWords.length, s)
								CheckIfLongest("sentenceChr", myListOfWords.join(' ').length, s)

								MetaDataAddWordCount(myListOfWords.length, isSpeech)
								
								if (gatherHeadingStatsHere)
								{
									gatherHeadingStatsHere.numWords += myListOfWords.length
								}

//								var newListOfWords = []

								for (var word of myListOfWords)
								{
									word = word.replace(/^[\-']+/, "").replace(/[\-']+$/, "")
									
									if (word)
									{
										if (shouldStartWithCapital) // TODO: or if a name
										{
											CheckStartsWithCapital(word, shouldStartWithCapital, s)
										}
										
//										newListOfWords.push(wordLower)
										shouldStartWithCapital = CheckEachWord(word, s, workspace, gatherHeadingStatsHere) && ("following " + word + " in")
									}
									else
									{
										IssueAdd("Empty word in " + FixStringHTML(s), "EMPTY WORD")
									}
								}
								
								var newElement = {text:s, isSpeech:isSpeech/*, listOfWords:newListOfWords*/}
								
								if (IssueGetTotal() != oldNumIssues)
								{
									newElement.hasIssues = true
								}

								g_sentences.push(newElement)
								sentenceDidSomething = true
							}

							if (sentenceDidSomething)
							{
								processedSomething = true
								lastSentenceThatDidSomething = "after '" + s + "' in"
							}
							else
							{
								if (expectNextBitToDoSomething)
								{
									IssueAdd("Expected next chunk of text to be a valid sentence " + lastSentenceThatDidSomething + " '" + txtInProcessed + "'", "EMPTY SENTENCE")
								}
							}
							expectNextBitToDoSomething = true
						}

						CheckIfLongest("paraSentences", numSentences, sentences)
						CheckIfLongest("paraChr", txtIn.length, sentences)
					}
				}
				
				if (g_disabledWarnings.SCRIPT && !workspace.foundToDoInParagraph)
				{
					CheckFinalCharacter(txtInProcessed)
				}
				
				if (! processedSomething)
				{
					IssueAdd("Paragraph '" + txtInRaw + "' contained no sentences", "EMPTY PARAGRAPH")
				}
				
				delete workspace.foundToDoInParagraph
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
		CallTheseFunctions(ShowContentForSelectedTab)
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
		const issueType = endsWithSpeech ? "INVALID FINAL SPEECH CHARACTER" : "INVALID FINAL NARRATIVE CHARACTER"
		IssueAdd("Final important character of " + FixStringHTML(txtFull) + " is " + FixStringHTML(finalCharacter) + " (valid characters are " + FixStringHTML(Object.keys(checkHere).join(" ")) + ")", issueType)
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

