//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_numberRules = []
var g_profileAnalysis = {}

// var g_uniqueWords = []

const kReplaceOnlyKeepBraces   =  /[^\[\]\{\}\(\)]/g
const kReplaceFullStops        =  /\./g
const kReplaceCarats           =  /\^/g
const kReplaceValidCharacters  =  /[A-Z0-9# \(\)'\.]+/g
const kReplaceStartStuff       =  /^['\u2026]+/
const kReplaceEndStuff         =  /[,'\u2026]+$/
const kRemoveWordStartPunc     =  /^[\-']+/
const kRemoveWordEndPunc       =  /[\-']+$/

const kSplitToCheckForGappyPunctuation  =  /[\.,;:!\?]+["\)]?/
const kSplitIntoFragments               =  /([\|\!\?;:]+) */

const kBraces = {['{']:'}', ['[']:']', ['(']:')'}

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

//==========================================================
// CHECKING FOR ILLEGAL SUBSTRINGS...
//==========================================================

function ShouldIgnoreNumberFoundInText(number)
{
	for (var myReg of g_numberRules)
	{
		if (number.match(myReg))
		{
			return true
		}
	}

	return false
}

const kIllegalSubstrings =
[
	["tab character", "\t"],
	["numbers", /#?[A-Z\/\-\.]*[0-9]+[A-Z\/\-0-9]*/gi, ShouldIgnoreNumberFoundInText],
	["double apostrophe", "''"],
	["misused hyphen", /( \-)|(\- )/g],
	["double quote", "\"\""],
	["double space", "  "],
	["dubious punctuation combo", /[;:\-,\.\!\?][;:\-,\.\!\?]/g, txt => txt == "!?"],
	["space before punctuation", / [;:,\.\!\?]/g],
	["split infinitive", /\bto (not|never|always|almost|[a-z][a-z]+ly) [a-z][a-z]+/gi, txt => g_tweakableSettings.splitInfinitiveIgnoreList.includes(txt)],
	["adverb with hyphen", /\b[a-z]+ly\-[a-z]+\b/gi, txt => g_tweakableSettings.adverbHyphenIgnoreList.includes(txt)]
]

function SetUp()
{
	g_onQueueEmpty.push(ShowTabs)
	CallTheseFunctions(InitTabs, InitSettings, AddAllInputBoxes, BuildTabs, InitToTop, SetUp_FixTitle, SettingsLoad, ProcessInput)
}

function CheckStringForEvenBraces(txtIn)
{
	const justBraces = txtIn.replace(kReplaceOnlyKeepBraces, '')
	
	if (justBraces)
	{
		var closeThese = []
		
		for (var b of justBraces)
		{
			const closing = kBraces[b]
			
			if (closing)
			{
				closeThese.push(closing)
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

function CheckEachWord(word, s, workspace)
{
	const wordLower = word.toLowerCase()
	const {plainBadWords, badWordRegExpressions, checkedWordsSeenInLowerCase} = workspace
	
	if (wordLower in plainBadWords)
	{
		IssueAdd("Found disallowed word " + FixStringHTML(word) + " in " + FixStringHTML(s), "DISALLOWED WORD")
	}
	else if (wordLower == "todo")
	{
		g_metaDataCurrentContainsToDo = true
	}
	else if (! (wordLower in g_checkedWords))
	{
		for (var badWordRegEx of badWordRegExpressions)
		{
			if (wordLower.match(badWordRegEx))
			{
				IssueAdd("Found (regex " + badWordRegEx + ") disallowed word " + FixStringHTML(word) + " in " + FixStringHTML(s), "DISALLOWED WORD")
				plainBadWords[wordLower] = true
			}
		}
	}

//	CheckForInternationalTally(wordLower)
	
	const lastApostrophe = word.lastIndexOf("'")
	if (lastApostrophe > 0)
	{
		CheckEachWord(word.substr(0, lastApostrophe), s, workspace)
		return false
	}

	Tally (g_checkedWords, wordLower)

	if (wordLower === word)
	{
		checkedWordsSeenInLowerCase[wordLower] = true
	}
		
	return ["mr.", "dr.", "mrs."].includes(wordLower)
}

function ShouldIgnorePara(txtInProcessed)
{
	if (txtInProcessed === "" || SettingsSayShouldIgnore(txtInProcessed) || MarkupProcessedLine(txtInProcessed))
	{
		return true
	}
	
	for (var t of kAutoTagKeys)
	{
		const withoutKey = txtInProcessed.replace(t, '')
		
		if (withoutKey != txtInProcessed)
		{
			const autoTagSettings = kAutoTagStuff[t]
			const {tag, characters, numericalCheck, clearTags, includeLineInText} = autoTagSettings
			var storeAs = withoutKey.trim()
			
			if (characters)
			{
				storeAs = storeAs.replace(new RegExp('[' + EscapeRegExSpecialChars(characters) + ']', 'g'), "")
			}
			
			MetaDataSet(tag, storeAs)
			
			for (var clearEach of OnlyKeepValid(clearTags.split(' ')))
			{
				MetaDataSet(clearEach)
			}

			kAutoTagChecks[numericalCheck].func?.(tag, storeAs)

			for (var [k, data] of kAutoTagOptions)
			{
				if (autoTagSettings[k])
				{
					data?.func?.(tag, storeAs)
				}
			}

			return !includeLineInText
		}
	}
	
	return false
}

function CheckStartsWithCapital(word, reason, s)
{

}

function SplitIntoFragments(thisBunch)
{
	const fragments = []
	const joiners = []
	const allBits = thisBunch.split(kSplitIntoFragments)
	
	for (;;)
	{
		var oneFragment = allBits.shift()
		var oneJoiner = allBits.shift()
		
		if (oneFragment || oneJoiner)
		{
			fragments.push(oneFragment)
			
			if (oneJoiner)
			{
				oneJoiner = oneJoiner.replaceAll('|', '.')
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

function MakeRegexForSplittingIntoWords()
{
	var allowedInWords = kCharacterEmDash + "-.%#'&0123456789"

	for (var chr of g_tweakableSettings.allowedCharacters)
	{
		if (! allowedInWords.includes(chr))
		{
			if (chr.toLowerCase() != chr.toUpperCase())
			{
				allowedInWords += chr
			}
		}
	}
	return new RegExp('[^' + EscapeRegExSpecialChars(allowedInWords) + ']+', 'i')
}

function SetUpBadWordRules(workspace)
{
	for (var badWord of OnlyKeepValid(g_tweakableSettings.badWords.toLowerCase().split(" ")))
	{
		if (badWord.includes('*'))
		{
			var useInRegEx = (badWord[0] == '*') ? badWord.substring(1) : ("^" + badWord)

			if (useInRegEx.endsWith('*'))
			{
				useInRegEx = useInRegEx.slice(0, -1)
			}
			else
			{
				useInRegEx += "$"
			}
			
			const myRegEx = new RegExp(useInRegEx)
			if (myRegEx)
			{
				workspace.badWordRegExpressions.push(myRegEx)
			}
			else
			{
				IssueAdd("Failed to turn bad word string '" + badWord + "' into regular expression", "SETTINGS")
			}
		}
		else
		{
			workspace.plainBadWords[badWord] = true
		}
	}
}

function SetUpNumberRules()
{
	g_numberRules = []

	for (var eachIgnoreRule of g_tweakableSettings.numberIgnoreList)
	{
		const myReg = new RegExp('^' + eachIgnoreRule + '$', 'i')
		
		if (myReg)
		{
			g_numberRules.push(myReg)
		}
		else
		{
			IssueAdd("Failed to turn number rule '" + eachIgnoreRule + "' into regular expression", "SETTINGS")
		}
	}
}

function AnalyseParagraph(workspace, txtInRaw, txtInProcessed, oldNumIssues)
{
	Tally (g_profileAnalysis, "AnalyseParagraph")

	//==================================
	// Check for issues
	//==================================

	for (var [k,v,allowFunc] of kIllegalSubstrings)
	{
		var grabEmHere = {}
		const changed = txtInProcessed.replace(v, matched => (allowFunc?.(matched)) ? matched : (grabEmHere[matched] = true, HighlighterWithDots(matched)))

		if (changed != txtInProcessed)
		{
			for (laa of Object.keys(grabEmHere))
			{
				IssueAdd("Found " + FixStringHTML(laa) + " in " + FixStringHTML(changed), k.toUpperCase(), laa)
			}
		}
	}

	const firstCharacter = txtInProcessed[0].toUpperCase()
	const {allowedStartCharacters, endOfSpeech, startOfSpeech} = g_tweakableSettings
	
	if (! allowedStartCharacters.includes(firstCharacter))
	{
		IssueAdd("First character " + FixStringHTML(firstCharacter) + " of " + FixStringHTML(txtInProcessed) + " is not an allowed start character " + FixStringHTML(allowedStartCharacters), "ILLEGAL START CHARACTER", firstCharacter)
	}		

	const braceError = CheckStringForEvenBraces(txtInProcessed)
	
	if (braceError)
	{
		IssueAdd("Mismatched brackets in " + FixStringHTML(txtInProcessed) + ": " + braceError, "BRACKETS")
	}
	
	const splittyFun = txtInProcessed.split(kSplitToCheckForGappyPunctuation)
	splittyFun.shift()
	for (var each of splittyFun)
	{
		if (each && ! each.startsWith(' ') && ! each.startsWith("'"))
		{
			IssueAdd("Found punctuation not followed by space before " + FixStringHTML(each) + " in " + FixStringHTML(txtInProcessed), "PUNCTUATION WITHOUT SPACE")
		}
	}
	
	//==================================
	// Process it
	//==================================
	
	const bScriptMode = ! g_disabledWarnings.SCRIPT
	const talkyNonTalky = bScriptMode ? [txtInProcessed] : txtInProcessed.split('"')

	if ((talkyNonTalky.length & 1) == 0)
	{
		IssueAdd("Found odd number of quotation marks in " + FixStringHTML(txtInProcessed), "UNFINISHED QUOTE")
	}
	
	var isSpeech = true
	var shouldStartWithCapital = "at the start of"
	var nextSpeechShouldStartWithCapital = true
	var bCanCheckFinalCharacter = true
	var bIgnoreFragments = false
	var isTreatingAsSpeech = false
	const storeAsFragments = []

	for (const eachIn of talkyNonTalky)
	{
		// Use | instead of . so that we can put back things like "Mr. Smith".
		const each = eachIn.replace(kReplaceFullStops, '|').replace(kReplaceCarats, '.')
		const firstCharacterHere = eachIn[0]

		var thisBunchOfFragments = each.trim()
		isSpeech = !isSpeech

		if (bScriptMode)
		{
			if (firstCharacterHere == '(')
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
				const withValidCharsRemoved = thisBunchOfFragments.replace(kReplaceValidCharacters, '')

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
			// Allow paragraphs to start with things like "... and a hamster," he finished.
			if (shouldStartWithCapital && isSpeech && firstCharacterHere == kCharacterElipsis)
			{
				shouldStartWithCapital = false
				nextSpeechShouldStartWithCapital = false
			}				

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
				IssueAdd("Found empty speech in " + FixStringHTML(txtInProcessed), "EMPTY SPEECH")
			}
			else
			{
				if (each != thisBunchOfFragments)
				{
					IssueAdd("Found white space at beginning and/or end of speech: " + FixStringHTML(each), "SPACE IN SPEECH")
				}

				const finalCharacter = eachIn.slice(-1)

				if (! endOfSpeech.includes(finalCharacter))
				{
					IssueAdd("Final character of dialogue " + FixStringHTML(eachIn) + " is " + FixStringHTML(finalCharacter) + " (valid characters are " + FixStringHTML(endOfSpeech.split('').join(' ')) + ")", "INVALID FINAL SPEECH CHARACTER", finalCharacter)
				}

				if (! startOfSpeech.includes(firstCharacterHere))
				{
					IssueAdd("First character of dialogue " + FixStringHTML(eachIn) + " is " + FixStringHTML(firstCharacterHere) + " (valid characters are " + FixStringHTML(startOfSpeech.split('').join(' ')) + ")", "INVALID FIRST SPEECH CHARACTER", firstCharacterHere)
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
			Tally (g_profileAnalysis, "Chunk (" + (isSpeech ? "speech" : "narrative") + (bScriptMode ? ", script)" : ")"))

			if (g_stillLookingForTagText)
			{
				Tally (g_profileAnalysis, "Look for tag text")

				const putBackTogether = sentences.join(' ').toLowerCase()
				const entries = Object.entries(g_stillLookingForTagText)

				for (var [lookForKey, lookForVal] of entries)
				{
					if (putBackTogether.includes(lookForVal))
					{
						if (entries.length > 1)
						{
							delete g_stillLookingForTagText[lookForKey]
						}
						else
						{
							g_stillLookingForTagText = null
						}
					}
				}
			}
			
			for (var s of sentences)
			{
				Tally (g_profileAnalysis, "Sentence")

				const followedBy = joiners.shift()

				const remains = s.replace(workspace.regexForRemovingValidChars, '')
				if (remains != '')
				{
					IssueAdd("Characters " + FixStringHTML(remains) + " found in " + FixStringHTML(s), "ILLEGAL CHARACTERS", remains)
				}
				
				s = s.replace(kReplaceStartStuff, "").replace(kReplaceEndStuff, "")
				const myListOfWords = OnlyKeepValid(s.split(workspace.regexForSplittingIntoWords))
				const numWords = myListOfWords.length
				
				if (numWords)
				{
					g_metaDataTally.Words += numWords
					
					if (isSpeech)
					{
						g_metaDataTally.Speech += numWords
					}

					for (var word of myListOfWords)
					{
						word = word.replace(kRemoveWordStartPunc, "").replace(kRemoveWordEndPunc, "")
						
						if (word == kCharacterEmDash)
						{
							shouldStartWithCapital = false
						}
						else if (word)
						{
							if (shouldStartWithCapital)
							{
								const letter = word[0]

								if (letter == letter.toLowerCase())
								{
									IssueAdd("Expected " + FixStringHTML(word) + " to start with a capital letter " + shouldStartWithCapital + " " + FixStringHTML(s), "CAPITALS")
								}
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
		else
		{
			NovaLog("No sentences in " + eachIn)
		}
	}
	
	if (bCanCheckFinalCharacter)
	{
		CheckFinalCharacter(txtInProcessed, isTreatingAsSpeech)
	}

	//========================
	// STORE IT
	//========================
	
	const pushThis = {allOfIt:txtInRaw, fragments:storeAsFragments, issues:g_issueCount - oldNumIssues}

	if (bIgnoreFragments)
	{
		pushThis.ignoreFragments = true
	}
	else
	{
		for (var eachEntity of g_nameLookup)
		{
			const results = txtInRaw.match(eachEntity.regex)

			if (results)
			{
				eachEntity.grandTotal += results.length
				Tally(g_metaDataTally.Mentions, eachEntity.means, results.length)
			}
		}
	}

	if (g_metaDataGatherParagraphs.length == 0)
	{
		Tally (g_profileAnalysis, "Metadata section: create")
		g_metaDataCurrentCompleteness = g_metaDataNextCompleteness
		g_metaDataNextCompleteness = 100
	}

	g_metaDataGatherParagraphs.push(pushThis)
	
	PairDoneParagraph(pushThis)
}

function ProcessInput()
{
	DoEvent("clear")
	
	const {allowedCharacters, suggestNameIfSeenThisManyTimes} = g_tweakableSettings

	g_profileAnalysis = {}
//	g_uniqueWords = []
	g_checkedWords = {}

	var workspace =
	{
		checkedWordsSeenInLowerCase:{},
		plainBadWords:{},
		numberRules:[],
		badWordRegExpressions:[],
		regexForRemovingValidChars:new RegExp('[' + EscapeRegExSpecialChars(allowedCharacters) + ']', 'g'),
		treatNextParagraphAsSpeech:false,
		regexForSplittingIntoWords:MakeRegexForSplittingIntoWords()
	}

	const replaceRules = SettingsGetReplacementRegularExpressionsArray()
	
	SetUpBadWordRules(workspace)
	SetUpNumberRules()
	
	for (const txtInRaw of GetInputText())
	{
		try
		{
			Tally (g_profileAnalysis, "Try")

			const oldNumIssues = g_issueCount
			var txtInProcessed = txtInRaw.trim()
			
			if (txtInProcessed != txtInRaw)
			{
				IssueAdd("Paragraph starts and/or ends with space: " + FixStringHTML(txtInRaw), "LEADING OR TRAILING SPACE")
			}

			for (var {regex, replaceWith} of replaceRules)
			{
				txtInProcessed = txtInProcessed.replace(regex, replaceWith)
			}

			if (! ShouldIgnorePara(txtInProcessed))
			{
				AnalyseParagraph(workspace, txtInRaw, txtInProcessed, oldNumIssues)
			}
		}
		catch(error)
		{
			ShowError("While parsing " + txtInRaw + ":\n\n" + error.stack)
		}
	}
	
	console.log(g_profileAnalysis)

//	NovaLog("Found " + Object.keys(g_checkedWords).length + " unique word(s)")

	g_entityNewNameSuggestions = []

	for (var [word, count] of Object.entries(g_checkedWords))
	{
		if (word.length > 1 && count >= suggestNameIfSeenThisManyTimes && ! (word in workspace.checkedWordsSeenInLowerCase))
		{
			g_entityNewNameSuggestions.push({word:word, count:count})
		}

/*		if (count == 1)
		{
			g_uniqueWords.push(word)
		}*/
	}
	
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
