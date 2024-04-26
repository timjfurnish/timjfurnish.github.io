//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_markupFunctions = {}

function SetMarkupFunction(character, func)
{
	g_markupFunctions[character] = func
}

// Value is whether the punctuation in question ends a sentence
const kValidJoiners =
{
	[""]:false,
	[":"]:false,
	[";"]:false,
	["!"]:true,
	["."]:true,
	["!?"]:true,
	["?"]:true
}

const kIllegalSubstrings =
[
	["tab character", "\t"],
	["numbers", /#?[A-Z\/\-\.]*[0-9]+[A-Z\/\-0-9]*/gi, txt => g_tweakableSettings.numberIgnoreList.includes(txt)],
	["double apostrophe", "''"],
	["misused hyphen", /( \-)|(\- )/g],
	["double quote", "\"\""],
	["double space", "  "],
	["dubious punctuation combo", /[;:\-,\.\!\?][;:\-,\.\!\?]/g, txt => txt == "!?"],
	["space before punctuation", / [;:,\.\!\?]/g],
	["split infinitive", /\bto [a-z][a-z]+ly [a-z]+/gi, txt => g_tweakableSettings.splitInfinitiveIgnoreList.includes(txt)]
]

function SetUp()
{
	g_onQueueEmpty.push(ShowTabs)
	CallTheseFunctions(InitTabs, InitSettings, AddAllInputBoxes, BuildTabs, SetUp_FixTitle, SettingsLoad, ProcessInput)
}

function CheckStringForEvenBraces(txtIn)
{
	const justBraces = txtIn.replace(/[^\[\]\{\}\(\)]/g, '')
	
	if (justBraces)
	{
		var closeThese = []
		
		for (var b of justBraces)
		{
			if (b == '(')
			{
				closeThese.push(')')
			}
			else if (b == '[')
			{
				closeThese.push(']')
			}
			else if (b == '{')
			{
				closeThese.push('}')
			}
			else
			{
				const shouldBe = closeThese.pop()

				if (b != shouldBe)
				{
					return "found " + FixStringHTML(b) + " while expecting " + (shouldBe ? FixStringHTML(shouldBe) : "nothing")
				}
			}			
		}
		
		if (closeThese.length)
		{
			return "reached end of text without closing " + FixStringHTML(closeThese.join(' '))
		}
	}
	
	return null
}

function CheckParagraphForIssues(txtIn)
{
	if (! g_tweakableSettings.allowedStartCharacters.includes(txtIn[0].toUpperCase()))
	{
		IssueAdd("First character of " + FixStringHTML(txtIn) + " is not an allowed start character " + FixStringHTML(g_tweakableSettings.allowedStartCharacters), "ILLEGAL START CHARACTER")
	}		

	const braceError = CheckStringForEvenBraces(txtIn)
	
	if (braceError)
	{
		IssueAdd("Mismatched brackets in " + FixStringHTML(txtIn) + ": " + braceError, "BRACKETS")
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
	if (txtInProcessed === "" || SettingsSayShouldIgnore(txtInProcessed))
	{
		return true
	}
	
	const markupFunc = g_markupFunctions[txtInProcessed[0]]
	
	if (markupFunc)
	{
		markupFunc(txtInProcessed.substring(1))
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

				// TODO: Log an issue if this is true?
				workspace.treatNextParagraphAsSpeech = false
				workspace.stillLookingForChapterNameInChapter = displayThis.split(/ *\(/, 1)[0].toLowerCase()
				MetaDataSet("CHAPTER", displayThis)

				delete workspace.foundTextBetweenHeadings
				return true
			}
		}
	}
	
	return false
}

function SplitIntoFragments(thisBunch)
{
	const fragments = []
	const joiners = []
	const allBits = thisBunch.split(/([\|\!\?;:]+) */g)
	
	for (;;)
	{
		var oneFragment = allBits.shift()
		var oneJoiner = allBits.shift()
		
		if (oneFragment || oneJoiner)
		{
			fragments.push(oneFragment)
			
			if (oneJoiner)
			{
				oneJoiner = oneJoiner.replace(/\|/g, '.')
				joiners.push(oneJoiner)
			}
			else
			{
				joiners.push("")
			}
		}
		else
		{
			return [fragments, joiners]
		}
	}
}

function ProcessInput()
{
	DoEvent("clear")

	// TODO: move more local variables into here
	var workspace =
	{
		stillLookingForChapterNameInChapter:null,
		badWords:MakeSet(...OnlyKeepValid(g_tweakableSettings.badWords.toLowerCase().split(" "))),
		replaceRules:SettingsGetReplacementRegularExpressionsArray(),
		regexForRemovingValidChars:new RegExp('[' + EscapeRegExSpecialChars(g_tweakableSettings.allowedCharacters) + ']', 'g'),
		treatNextParagraphAsSpeech:false
	}

	for (var txtInRaw of GetInputText())
	{
		try
		{
			const oldNumIssues = IssueGetTotal()

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

				const bScriptMode = ! g_disabledWarnings.SCRIPT
				const talkyNonTalky = bScriptMode ? [txtInProcessed] : txtInProcessed.split('"')

				if ((talkyNonTalky.length & 1) == 0)
				{
					IssueAdd("Found odd number of quotation marks in " + FixStringHTML(txtInRaw), "UNFINISHED QUOTE")
				}
				
				var isSpeech = true
				var shouldStartWithCapital = "at the start of"
				var nextSpeechShouldStartWithCapital = true
				var bCanCheckFinalCharacter = true
				var bIgnoreFragments = false
				var isTreatingAsSpeech = false

				for (var eachIn of talkyNonTalky)
				{
					// Use | instead of . so that we can put back things like "Mr. Smith".
					const each = eachIn.replace(/[\(\)]/g, '').replace(/\./g, '|').replace(/\^/g, '.')

					var thisBunchOfFragments = each.trim()
					isSpeech = !isSpeech

					if (bScriptMode)
					{
						Assert(isSpeech == false)

						if (eachIn[0] == '(')
						{
							// Allow paragraphs like "(whispered)"
							workspace.treatNextParagraphAsSpeech = true
							shouldStartWithCapital = false
							bCanCheckFinalCharacter = false
							bIgnoreFragments = true
						}
						else if (workspace.treatNextParagraphAsSpeech)
						{
							// This is speech because last line said so...
							isSpeech = true
							workspace.treatNextParagraphAsSpeech = false
							isTreatingAsSpeech = true
						}
						else
						{
							const withValidCharsRemoved = thisBunchOfFragments.replace(/[A-Z0-9# \(\)'\.]+/, '')

							if (withValidCharsRemoved == '')
							{
								workspace.treatNextParagraphAsSpeech = true
								bCanCheckFinalCharacter = false
								bIgnoreFragments = true
							}
							else if (thisBunchOfFragments == thisBunchOfFragments.toUpperCase())
							{
								workspace.treatNextParagraphAsSpeech = false
								bCanCheckFinalCharacter = false
							}
							else
							{
								workspace.treatNextParagraphAsSpeech = false
							}
						}
					}
					else
					{
						workspace.treatNextParagraphAsSpeech = false
					}

					if (isSpeech)
					{
						if (nextSpeechShouldStartWithCapital)
						{
							shouldStartWithCapital = "at the start of dialogue"
						}
						
						nextSpeechShouldStartWithCapital = false

						if (! thisBunchOfFragments)
						{
							IssueAdd("Found empty speech in " + FixStringHTML(txtInRaw), "EMPTY SPEECH")
						}
						else
						{
							if (each != thisBunchOfFragments)
							{
								IssueAdd("Found white space at beginning and/or end of speech: " + FixStringHTML(each), "SPACE IN SPEECH")
							}

							const firstCharacter = eachIn[0]
							const finalCharacter = eachIn.slice(-1)

							if (! g_tweakableSettings.endOfSpeech.includes(finalCharacter))
							{
								IssueAdd("Final character of dialogue " + FixStringHTML(eachIn) + " is " + FixStringHTML(finalCharacter) + " (valid characters are " + FixStringHTML(g_tweakableSettings.endOfSpeech.split('').join(' ')) + ")", "INVALID SPEECH CHARACTER")
							}

							if (! g_tweakableSettings.startOfSpeech.includes(firstCharacter))
							{
								IssueAdd("First character of dialogue " + FixStringHTML(eachIn) + " is " + FixStringHTML(firstCharacter) + " (valid characters are " + FixStringHTML(g_tweakableSettings.startOfSpeech.split('').join(' ')) + ")", "INVALID SPEECH CHARACTER")
							}
						}
					}

					if (!thisBunchOfFragments)
					{
						continue
					}

					const [sentences, joiners] = SplitIntoFragments(thisBunchOfFragments)
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

						for (var s of sentences)
						{
							const followedBy = joiners.shift()

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
							const myListOfWords = OnlyKeepValid(s.split(/[^\u2014\-\.%#'a-zA-Z0-9\&]+/))

							if (myListOfWords.length)
							{
								MetaDataAddWordCount(myListOfWords.length, isSpeech)
								
								for (var word of myListOfWords)
								{
									word = word.replace(/^[\-']+/, "").replace(/[\-']+$/, "")
									
									if (word == kCharacterEmDash)
									{
										shouldStartWithCapital = false
									}
									else if (word)
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
								
								var newElement = {text:s, followedBy:followedBy}
								
								if (isSpeech)
								{
									newElement.isSpeech = true
								}
								
								storeAsFragments.push(newElement)
							}
							
							const marksEndOfSentence = kValidJoiners[followedBy]
							
							if (marksEndOfSentence === undefined)
							{
								IssueAdd("Unexpected punctuation combo '" + followedBy + "' after " + FixStringHTML(s), "PUNCTUATION COMBO")
							}
							else if (marksEndOfSentence === true)
							{
								if (joiners.length || followedBy == '.' || !isSpeech)
								{
									shouldStartWithCapital = "following '" + followedBy + "' in"
								}
								
								if (isSpeech && joiners.length == 0)
								{
									nextSpeechShouldStartWithCapital = true
								}
							}
							else
							{
								shouldStartWithCapital = false
							}
						}
					}
				}
				
				if (bCanCheckFinalCharacter)
				{
					CheckFinalCharacter(txtInProcessed, isTreatingAsSpeech)
				}
				
				const pushThis = {allOfIt:txtInVeryRaw, fragments:storeAsFragments, issues:IssueGetTotal() - oldNumIssues}
				
				if (bIgnoreFragments)
				{
					pushThis.ignoreFragments = true
				}

				g_metaDataGatherParagraphs.push(pushThis)
			}
		}
		catch(error)
		{
			ShowError("While parsing " + txtInRaw + ":\n\n" + error.stack)
		}
	}

	DoEndOfChapterChecks(workspace)
	CallTheseFunctions(AfterProcessInput)
}

function AfterProcessInput()
{	
	DoEvent("processingDone")

	if (g_selectedTabName != 'settings')
	{
		CallTheseFunctions(ShowContentForSelectedTab)
	}
}

function CheckFinalCharacter(txtIn, endsWithSpeech)
{
	const txtFull = txtIn
	var finalCharacter = txtIn.slice(-1)

	if (! endsWithSpeech)
	{
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
	}

	const checkHere = endsWithSpeech ? g_tweakableSettings.endOfParagraphSpeech : g_tweakableSettings.endOfParagraphNarrative

	if (! (checkHere.includes(finalCharacter)))
	{
		IssueAdd("Final important character of " + FixStringHTML(txtFull) + " is " + FixStringHTML(finalCharacter) + " (valid characters are " + FixStringHTML(checkHere.split('').join(" ")) + ")", "INVALID FINAL CHARACTER")
	}
}

function DoEndOfChapterChecks(workspace)
{
	if (workspace.stillLookingForChapterNameInChapter && workspace.foundTextBetweenHeadings)
	{
		IssueAdd("Didn't find chapter name in chapter '" + workspace.stillLookingForChapterNameInChapter + "'", "CHAPTER NAME IN CHAPTER")
	}
}

