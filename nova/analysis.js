//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

const kIllegalSubstrings =
[
	["tab character", "\t"],
	["numbers", /#?[A-Z\/\-\.]*[0-9]+[A-Z\/\-0-9]*/gi, txt => g_tweakableSettings.numberIgnoreList.includes(txt)],
	["double apostrophe", "''"],
	["misused hyphen", /( \-)|(\- )/g],
	["double quote", "\"\""],
	["double space", "  "],
	["dubious punctuation combo", /[;:,\.\!\?][;:,\.\!\?]/g, txt => txt == "!?"],
	["space before punctuation", / [;:,\.\!\?]/g],
	["split infinitive", /\bto [a-z]+ly [a-z]+/gi, txt => g_tweakableSettings.splitInfinitiveIgnoreList.includes(txt)]
]

function SetUp()
{
	CallTheseFunctions(BuildTabs, SetUp_FixTitle, SettingsLoad, AddAllInputBoxes, ShowContentForSelectedTab, ProcessInput)
}

function CheckParagraphForIssues(txtIn)
{
	if (! g_tweakableSettings.allowedStartCharacters.includes(txtIn[0].toUpperCase()))
	{
		IssueAdd("First character of " + FixStringHTML(txtIn) + " is not an allowed start character " + FixStringHTML(g_tweakableSettings.allowedStartCharacters), "ILLEGAL START CHARACTER")
	}		

	txtIn = txtIn.replace(/[\(\)]/g, '')

	const splittyFun = txtIn.split(/[\.,!\?]+["\)]?/)
	splittyFun.shift()
	for (var each of splittyFun)
	{
		if (each && ! each.startsWith(' ') && ! each.startsWith("'"))
		{
			IssueAdd("Found punctuation not followed by space before " + FixStringHTML(each) + " in " + FixStringHTML(txtIn), "PUNCTUATION WITHOUT SPACE")
		}
	}
}

function CheckEachWord(word, s, workspace)
{
	const wordLower = word.toLowerCase()

	if (wordLower in workspace.badWords)
	{
		IssueAdd("Found disallowed word " + FixStringHTML(word) + " in " + FixStringHTML(s), "DISALLOWED WORD")
	}
	else if (wordLower == "todo")
	{
		MetaDataInformFoundToDo(s)
	}

	const name = g_nameLookup[wordLower]

	if (name)
	{
		if (! (word in g_permittedNameCapitalisations))
		{
			IssueAdd("Check capitalisation of " + FixStringHTML(word) + " in "  + FixStringHTML(s), "CAPITALS")			
		}
		
		MetaDataIncreaseCount(name)
	}
	
	const lastApostrophe = word.lastIndexOf("'")
	if (lastApostrophe > 0)
	{
		CheckEachWord(word.substr(0, lastApostrophe), s, workspace)
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
		for (var setter of txtInProcessed.substring(1).split(';'))
		{
			MetaDataSet(...setter.split(':', 2))
		}
		return true
	}
	else if (txtInProcessed[0] == '%')
	{
		MetaDataSetCompletenessPercent(parseInt(txtInProcessed.substring(1)))
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

function HandleNewHeading(workspace, txtInRaw, displayThis)
{
	for (var [k,v,allowFunc] of kIllegalSubstrings)
	{
		const changed = txtInRaw.replace(v, matched => (allowFunc?.(matched)) ? matched : HighlighterWithDots(matched))
		if (changed != txtInRaw)
		{
			IssueAdd("Found " + k + " in " + FixStringHTML(changed), k.toUpperCase())
		}
	}

	if (g_tweakableSettings.headingIdentifier)
	{
		if (displayThis.length <= g_tweakableSettings.headingMaxCharacters)
		{
			if (displayThis.includes(g_tweakableSettings.headingIdentifier))
			{
				if (g_tweakableSettings.removeHeadingIdentifier)
				{
					displayThis = displayThis.replace(g_tweakableSettings.headingIdentifier, '')
				}
				
				DoEndOfChapterChecks(workspace)

				workspace.stillLookingForChapterNameInChapter = displayThis.split(/ *\(/, 1)[0].toLowerCase()
				MetaDataSet("CHAPTER", displayThis)

				delete workspace.foundTextBetweenHeadings
				return true
			}
		}
	}
	
	return false
}

function EscapeRegExSpecialChars(txtIn)
{
	return txtIn.replace(/[.*+?^${}()|[\]\\\-]/g, "\\$&")
}

function ProcessInput()
{
	DoEvent("clear")

	var workspace =
	{
		stillLookingForChapterNameInChapter:null,
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

	for (var txtInRaw of GetInputText())
	{
		try
		{
			var txtInVeryRaw = txtInRaw.trim()
			
			if (txtInRaw != txtInVeryRaw)
			{
				IssueAdd("Paragraph starts and/or ends with space: " + FixStringHTML(txtInVeryRaw), "LEADING OR TRAILING SPACE")
			}

			txtInVeryRaw = txtInRaw

			for (var rule of workspace.replaceRules)
			{
				txtInRaw = txtInRaw.replace(rule.regex, rule.replaceWith)
			}

			if (! ShouldIgnorePara(txtInRaw) && ! HandleNewHeading(workspace, txtInRaw, txtInVeryRaw))
			{
				var txtInProcessed = txtInRaw.trim()
				var storeAsFragments = []
				
				workspace.foundTextBetweenHeadings = true

				CheckParagraphForIssues(txtInProcessed)

				const talkyNonTalky = txtInProcessed.split('"')

				if ((talkyNonTalky.length & 1) == 0)
				{
					IssueAdd("Found odd number of quotation marks in " + FixStringHTML(txtInRaw), "UNFINISHED QUOTE")
				}
				
				var isSpeech = true
				var shouldStartWithCapital = "at the start of"
				var processedSomething = false
				var nextSpeechShouldStartWithCapital = true

				for (var eachIn of talkyNonTalky)
				{
					const each = eachIn.replace(/[\(\)]/g, '').replace(/[\.\!\?;:]+ */g, '|').replace(/\|$/, '').replace(/\^/g, '.')

					var txtIn = each.trim()
					isSpeech = !isSpeech

					if (isSpeech)
					{
						if (nextSpeechShouldStartWithCapital)
						{
							shouldStartWithCapital = "at the start of"
						}
						
						nextSpeechShouldStartWithCapital = false

						if (! txtIn)
						{
							IssueAdd("Found empty speech in " + FixStringHTML(txtInRaw), "EMPTY SPEECH")
						}
						else
						{
							if (each != txtIn)
							{
								IssueAdd("Found white space at beginning and/or end of speech: " + FixStringHTML(each), "SPACE IN SPEECH")
							}

							var finalCharacter = eachIn.slice(-1)

							if (! g_tweakableSettings.endOfSpeech.includes(finalCharacter))
							{
								IssueAdd("Final character of dialogue " + FixStringHTML(eachIn) + " is " + FixStringHTML(finalCharacter) + " (valid characters are " + FixStringHTML(g_tweakableSettings.endOfSpeech.split('').join(' ')) + ")", "INVALID FINAL SPEECH CHARACTER")
							}
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
							
							s = s.replace(/^['\u2026]+/, "").replace(/[,'\u2026]+$/, "")
							const myListOfWords = OnlyKeepValid(s.split(/[^\-\.%#'a-zA-Z0-9\&]+/))

							if (myListOfWords.length)
							{
								MetaDataAddWordCount(myListOfWords.length, isSpeech)
								
								for (var word of myListOfWords)
								{
									word = word.replace(/^[\-']+/, "").replace(/[\-']+$/, "")
									
									if (word)
									{
										if (shouldStartWithCapital)
										{
											CheckStartsWithCapital(word, shouldStartWithCapital, s)
										}
										
										shouldStartWithCapital = CheckEachWord(word, s, workspace) && ("following " + word + " in")
									}
									else
									{
										IssueAdd("Empty word in " + FixStringHTML(s), "EMPTY WORD")
									}
								}
								
								var newElement = {text:s}
								
								if (isSpeech)
								{
									newElement.isSpeech = true
								}
								
								if (IssueGetTotal() != oldNumIssues)
								{
									newElement.hasIssues = true
								}

								storeAsFragments.push(newElement)
								sentenceDidSomething = true
							}

							if (sentenceDidSomething)
							{
								processedSomething = true
								lastSentenceThatDidSomething = "after " + FixStringHTML(s) + " in"
							}
							else
							{
								if (expectNextBitToDoSomething)
								{
									IssueAdd("Expected next chunk of text to be a valid sentence " + lastSentenceThatDidSomething + " " + FixStringHTML(txtInProcessed), "EMPTY SENTENCE")
								}
							}
							expectNextBitToDoSomething = true
						}
					}
				}
				
				g_metaDataGatherParagraphs.push({allOfIt:txtInVeryRaw, fragments:storeAsFragments})

				if (g_disabledWarnings.SCRIPT)
				{
					CheckFinalCharacter(txtInProcessed)
				}
				
				if (! processedSomething)
				{
					IssueAdd("Paragraph " + FixStringHTML(txtInRaw) + " contains no sentences", "EMPTY PARAGRAPH")
				}
			}
		}
		catch(error)
		{
			ShowError("While parsing " + txtInRaw + ":\n\n" + error.stack)
		}
	}
	
	DoEndOfChapterChecks(workspace)
	
	DoEvent("processingDone")

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

	const checkHere = endsWithSpeech ? g_tweakableSettings.endOfParagraphSpeech : g_tweakableSettings.endOfParagraphNarrative

	if (! (checkHere.includes(finalCharacter)))
	{
		const issueType = endsWithSpeech ? "INVALID FINAL SPEECH CHARACTER" : "INVALID FINAL NARRATIVE CHARACTER"
		IssueAdd("Final important character of " + FixStringHTML(txtFull) + " is " + FixStringHTML(finalCharacter) + " (valid characters are " + FixStringHTML(Object.keys(checkHere).join(" ")) + ")", issueType)
	}
}

function DoEndOfChapterChecks(workspace)
{
	if (workspace.stillLookingForChapterNameInChapter && workspace.foundTextBetweenHeadings)
	{
		IssueAdd("Didn't find chapter name in chapter '" + workspace.stillLookingForChapterNameInChapter + "'", "CHAPTER NAME IN CHAPTER")
	}
}

