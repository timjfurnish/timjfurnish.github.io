//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

var g_profileAnalysis = {}
var g_processInputWorkspace
var g_checkedWords = {}

const kReplaceOnlyKeepBraces      =  /[^‘’\u201C\u201D\[\]\{\}\(\)]/g // And opening/closing quotes
const kReplaceFullStops           =  /\./g
const kReplaceCarats              =  /\^/g
const kReplaceSpeechStartStuff    =  /^'|^‘|^(\u2026 )/
const kReplaceSentenceStartStuff  =  /^'|^‘|^\(/
const kReplaceSentenceEndStuff    =  /[,'’—\u2026]+$/

const kSplitToCheckForGappyPunctuation  =  /[\.,;:!\?]+["\u201D\)]?/
const kSplitIntoFragments               =  /([\|\!\?;:]+) */
const kSplitOnSpeechMarks               =  /[\u201C\u201D"]/

const kBraces = {['‘']:'’', ['{']:'}', ['[']:']', ['(']:')', ['\u201C']:'\u201D'}

// Boolean value is whether the punctuation in question ends a sentence
function MakeValidJoinersTable(table)
{
	table[':'] = table[';'] = table[','] = table[kCharacterElipsis] = false
	table['!'] = table['.'] = table['?'] = table["’."] = table[kCharacterElipsis + "?"] = true

	return table
}

const kValidJoinersSpeech = MakeValidJoinersTable({["’!"]:true, ["!?"]:true, ["’?"]:true, ["—"]:true})
const kValidJoinersNarrative = MakeValidJoinersTable({[""]:false})

//==========================================================
// CHECKING FOR ILLEGAL SUBSTRINGS...
//==========================================================

function ShouldIgnoreNumberFoundInText(number, txtInProcessed)
{
	for (var myReg of g_processInputWorkspace.numberRules)
	{
		if (number.match(myReg))
		{
			return true
		}
		else if (txtInProcessed.match(myReg))
		{
			return true
		}
	}

	return false
}

const kIllegalSubstrings =
[
	["numbers", /#?[A-Z\/\-\.]*[0-9]+[A-Z\/\-0-9]*%?/gi, ShouldIgnoreNumberFoundInText],
	["misused hyphen", /( \-)|(\- )/g],
	["irregular dash spacing", /( —[^ ])|([^ ]— )/g],
	["misused opening quote", /[^“\( ][‘“]/g],
	["double space", "  "],
	["dubious punctuation combo", /[;:\-,\.\!\?][‘'’“"”]?[;:\-,\.\!\?]/g, txt => txt == "!?"],
	["space before punctuation", / [;:,\.\!\?]/g],
	["split infinitive", /\bto (not|never|always|almost|[a-z][a-z]+ly) [a-z][a-z]+/gi, txt => (g_tweakableSettings.splitInfinitiveIgnoreList.includes(txt) || txt.toLowerCase().endsWith(" the"))],
	["adverb with hyphen", /\b[a-z]+ly\-[a-z]+\b/gi, txt => g_tweakableSettings.adverbHyphenIgnoreList.includes(txt)]
]

function SetUp()
{
	g_onQueueEmpty.push(ShowTabs)
	CallTheseFunctions(InitTabs, InitSettings, AddAllInputBoxes, BuildTabs, InitToTop, SetUp_FixTitle, SettingsLoad, ProcessInputBegin)
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
				var shouldBe = closeThese.pop()
				if (b != shouldBe)
				{
					if (b == '’')
					{
						if (shouldBe)
						{
							closeThese.push(shouldBe)
						}
					}
					else
					{
						IssueAdd("Mismatched brackets in " + FixStringHTML(txtIn) + ": found " + FixStringHTML(b) + " while expecting " + (shouldBe ? FixStringHTML(shouldBe) : "nothing"), "BRACKETS")
						return
					}
				}
			}
		}

		if (closeThese.length)
		{
			IssueAdd("Mismatched brackets in " + FixStringHTML(txtIn) + ": reached end of text without closing " + FixStringHTML(closeThese.join(' ')), "BRACKETS")
		}
	}
}

function CheckEachWord(word, s, isSpeech)
{
	const wordLower = word.toLowerCase()
	const {plainBadWords, badWordRegExpressions, checkedWordsSeenInLowerCase} = g_processInputWorkspace

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
	const lastApostrophe = word.lastIndexOf("’")
	if (lastApostrophe > 0)
	{
		CheckEachWord(word.substr(0, lastApostrophe), s, isSpeech)
		return false
	}
	if (! (wordLower in g_checkedWords))
	{
		g_checkedWords[wordLower] = {inSpeech:0, inNarrative:0}
	}

	Tally (g_checkedWords[wordLower], isSpeech ? "inSpeech" : "inNarrative")
	Tally (g_checkedWords[wordLower], "total")
	if (wordLower === word)
	{
		checkedWordsSeenInLowerCase[wordLower] = true
	}

	return ["mr.", "dr.", "mrs."].includes(wordLower)
}

function ShouldProcessPara(txtInProcessed)
{
	for (var t of g_autoTagKeys)
	{
		const withoutKey = txtInProcessed.replace(t, '')

		if (withoutKey != txtInProcessed)
		{
			const autoTagSettings = kAutoTagStuff[t]
			const {tag, numericalCheck, clearTags, includeLineInText, joinNextLine, number} = autoTagSettings
			var storeAs = withoutKey.trim()

			if (number)
			{
				storeAs = storeAs.replace(/[^0-9]/g, '')
			}

			if (joinNextLine)
			{
				storeAs += " " + g_processInputWorkspace.inputTextArray.shift()
			}
			
			MetaDataSet(tag, storeAs)

			for (var clearEach of OnlyKeepValid(clearTags.split(' ')))
			{
				MetaDataSet(clearEach)
			}
			kAutoTagChecks[numericalCheck].onTagSetFunc?.(tag, storeAs)

			// TO DO: Only need to check the ones with an onTagSetFunc
			for (var [k, data] of kAutoTagOptions)
			{
				if (autoTagSettings[k])
				{
					data?.onTagSetFunc?.(tag, storeAs)
				}
			}

			return includeLineInText
		}
	}

	return true
}

function SplitIntoFragments(thisBunch, splitRegex)
{
	const fragments = []
	const joiners = []
	const allBits = thisBunch.split(splitRegex)

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

function MakeListOfValidLetters()
{
	var validLetters = ""
	
	for (var chr of g_tweakableSettings.allowedCharacters)
	{
		const chrLow = chr.toLowerCase()

		if (! validLetters.includes(chrLow))
		{
			if (chrLow != chrLow.toUpperCase())
			{
				validLetters += chrLow
			}
		}
	}

	return validLetters
}

function MakeRegexForSplittingIntoWords(validLetters, captureJoiners)
{
	const matchThis = '[^' + EscapeRegExSpecialChars("-.%#&0123456789" + validLetters) + ']+'
	return captureJoiners ? new RegExp('(' + matchThis + ')', 'i') : new RegExp(matchThis, 'i')
}

function MakeRegexForRemovingLetters(validLetters)
{
	// Also remove anything that might be part of a word-like thing: digits, hyphens, apostrophes and '^' (representing '.' in an abreviation)
	const matchThis = '[' + EscapeRegExSpecialChars(' 0123456789-^’' + validLetters) + ']'
	return new RegExp(matchThis, 'ig')
}

function SetUpBadWordRules()
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
				g_processInputWorkspace.badWordRegExpressions.push(myRegEx)
			}
			else
			{
				IssueAdd("Failed to turn bad word string '" + badWord + "' into regular expression", "SETTINGS")
			}
		}
		else
		{
			g_processInputWorkspace.plainBadWords[badWord] = true
		}
	}
}

function SetUpNumberRules()
{
	for (var eachIgnoreRule of g_tweakableSettings.numberIgnoreList)
	{
		const myReg = new RegExp('^' + eachIgnoreRule + '$', 'i')

		if (myReg)
		{
			g_processInputWorkspace.numberRules.push(myReg)
		}
		else
		{
			IssueAdd("Failed to turn number rule '" + eachIgnoreRule + "' into regular expression", "SETTINGS")
		}
	}
}

function CheckLengthOfSomething(txtIn, term, {length}, limitName, countedWhat, category)
{
//	Assert(limitName in g_tweakableSettings)

	if (length > g_tweakableSettings[limitName])
	{
		IssueAdd(term + " contains " + length + " " + countedWhat + ": " + FixStringHTML(txtIn), category)
	}
}

function CheckOverusedPuncInPara(txtIn)
{
	const justPunc = txtIn.replace(g_processInputWorkspace.regexForRemovingLetters, '')

	CheckLengthOfSomething(txtIn, "Paragraph", justPunc, "warnParagraphAmountPunctuation", "punctuation symbols", "COMPLEX PUNCTUATION")
	CheckLengthOfSomething(txtIn, "Paragraph", Object.keys(MakeSet(...justPunc.replaceAll('“', '”'))), "warnParagraphAmountDifferentPunctuation", "distinct punctuation symbols", "COMPLEX PUNCTUATION")
	CheckLengthOfSomething(txtIn, "Paragraph", txtIn, "warnParagraphLength", "characters", "LONG TEXT")
}

function AnalyseParagraph(txtInRaw, txtInProcessed, oldNumIssues)
{
	Tally (g_profileAnalysis, "AnalyseParagraph")
	//==================================
	// Check for issues
	//==================================
	for (var [k,v,allowFunc] of kIllegalSubstrings)
	{
		var grabEmHere = {}
		const changed = txtInProcessed.replace(v, matched => (allowFunc?.(matched, txtInProcessed)) ? matched : (grabEmHere[matched] = true, HighlighterWithDots(matched)))
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

	CheckStringForEvenBraces(txtInProcessed)
	CheckOverusedPuncInPara(txtInProcessed)

	const splittyFun = txtInProcessed.split(kSplitToCheckForGappyPunctuation)
	splittyFun.shift()
	for (var each of splittyFun)
	{
		if (each && ! each.startsWith(' ') && ! each.startsWith("’"))
		{
			IssueAdd("Found punctuation not followed by space before " + FixStringHTML(each) + " in " + FixStringHTML(txtInProcessed), "PUNCTUATION WITHOUT SPACE")
		}
	}

	//==================================
	// Process it
	//==================================

	const bScriptMode = ! g_disabledWarnings.SCRIPT
	const talkyNonTalky = bScriptMode ? [txtInProcessed] : txtInProcessed.split(kSplitOnSpeechMarks)
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
				g_processInputWorkspace.treatNextParagraphAsSpeech = true
				shouldStartWithCapital = false
				bCanCheckFinalCharacter = false
				bIgnoreFragments = true
			}
			else if (g_processInputWorkspace.treatNextParagraphAsSpeech)
			{
				// This is speech because last line said so...
				isSpeech = true
				g_processInputWorkspace.treatNextParagraphAsSpeech = false
				isTreatingAsSpeech = true
			}
			else
			{
				// Work out if next line is speech
				const withValidCharsRemoved = thisBunchOfFragments.replace(/[A-Z0-9# \(\)'\.]+/g, '')
				if (withValidCharsRemoved == '')
				{
					g_processInputWorkspace.treatNextParagraphAsSpeech = true
					bCanCheckFinalCharacter = false
					bIgnoreFragments = true
				}
				else if (thisBunchOfFragments == thisBunchOfFragments.toUpperCase())
				{
					g_processInputWorkspace.treatNextParagraphAsSpeech = false
					bCanCheckFinalCharacter = false
				}
				else
				{
					g_processInputWorkspace.treatNextParagraphAsSpeech = false
				}
//				NovaLog("'" + thisBunchOfFragments + "' with valid characters removed leaves '" + withValidCharsRemoved + "' therefore treatNextParagraphAsSpeech=" + g_processInputWorkspace.treatNextParagraphAsSpeech)
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
			g_processInputWorkspace.treatNextParagraphAsSpeech = false
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

		const [sentences, joiners] = SplitIntoFragments(thisBunchOfFragments, kSplitIntoFragments)
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
				CheckLengthOfSomething(s, "Phrase", s, "warnPhraseLength", "characters", "LONG TEXT")

				var followedBy = joiners.shift()
				var precededBy = ""
				
				const replaceStartRule = isSpeech ? kReplaceSpeechStartStuff : kReplaceSentenceStartStuff
				
				s = s.replace(replaceStartRule, what =>
				{
					precededBy += what
					return ""
				}).replace(kReplaceSentenceEndStuff, what =>
				{
					followedBy = what + followedBy
					return ""
				})

				if (isSpeech && s.startsWith('…'))
				{
					IssueAdd("Punctuation combo " + FixStringHTML('…') + " should be followed by a space at start of speech chunk " + FixStringHTML(s), "PUNCTUATION COMBO")
				}

				const [myListOfWords, myListOfJoiners] = SplitIntoFragments(s, g_processInputWorkspace.regexForSplittingIntoWords)
				var numWords = 0
				var rebuild = ""

				for (var wordBit of myListOfWords)
				{
					const word = rebuild + wordBit
					const join = myListOfJoiners.shift()
				
					if (join == '’' && myListOfJoiners.length)
					{
						rebuild += word + join
					}
					else if (word)
					{
						if (! (join in g_processInputWorkspace.validWordJoiners))
						{
							IssueAdd("Unexpected punctuation [" + FixStringHTML(join) + "] in " + FixStringHTML(s), "PUNCTUATION: MID-PHRASE", join)
						}

						if (shouldStartWithCapital)
						{
							const letter = (word[0] == '’') ? word[1] : word[0]
							if (letter == letter.toLowerCase())
							{
								IssueAdd("Expected " + FixStringHTML(word) + " to start with a capital letter " + shouldStartWithCapital + " " + FixStringHTML(thisBunchOfFragments), "CAPITALS")
							}
						}

						shouldStartWithCapital = CheckEachWord(word, s, isSpeech) && ("following " + word + " in")
						++ numWords
						rebuild = ""
					}
					else
					{
						if (! (join in g_processInputWorkspace.validWordJoinersStart))
						{
							IssueAdd("Unexpected punctuation [" + FixStringHTML(join) + "] at the start of " + FixStringHTML(s), "PUNCTUATION: PHRASE START", join)
						}
					}
				}

				if (numWords)
				{					
					g_metaDataTally.Words += numWords

					if (isSpeech)
					{
						g_metaDataTally.Speech += numWords
					}

					var newElement = {text:precededBy + s, followedBy:followedBy}

					if (isSpeech)
					{
						newElement.isSpeech = true
					}

					storeAsFragments.push(newElement)
				}

				const marksEndOfSentence = isSpeech ? kValidJoinersSpeech[followedBy] : kValidJoinersNarrative[followedBy]

				if (marksEndOfSentence === undefined)
				{
					IssueAdd("Unexpected punctuation combo " + FixStringHTML(followedBy) + " at the end of " + (isSpeech ? "speech" : "narrative") + " chunk " + FixStringHTML(s + followedBy), "PUNCTUATION COMBO")
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

	const remains = txtInRaw.replace(g_processInputWorkspace.regexForRemovingValidChars, '')
	if (remains != '')
	{
		IssueAdd("Characters " + FixStringHTML(remains) + " found in " + FixStringHTML(txtInRaw), "ILLEGAL CHARACTERS", remains)
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
		++ g_metaDataTally.Paragraphs
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
	document.getElementById("blocker").style.display="block"

	CallTheseFunctions(StopTalking, ProcessInputBegin)
}

function ProcessInputBegin()
{
	DoEvent("clear")

	const validLetters = MakeListOfValidLetters()
	
	g_profileAnalysis = {}
	g_checkedWords = {}

	g_processInputWorkspace =
	{
		validWordJoiners:MakeSet('', ' ', '’', ...g_tweakableSettings.wordJoiners),
		validWordJoinersStart:MakeSet('', ' ', ...g_tweakableSettings.wordJoinersStart),
		checkedWordsSeenInLowerCase:{},
		plainBadWords:{},
		numberRules:[],
		badWordRegExpressions:[],
		regexForRemovingValidChars:new RegExp('[' + EscapeRegExSpecialChars(g_tweakableSettings.allowedCharacters) + ']', 'g'),
		treatNextParagraphAsSpeech:false,
		regexForSplittingIntoWords:MakeRegexForSplittingIntoWords(validLetters, true),
		regexForSplittingIntoWordsNoCap:MakeRegexForSplittingIntoWords(validLetters, false),
		regexForRemovingLetters:MakeRegexForRemovingLetters(validLetters),
		inputTextArray:GetInputText().split(/[\n]+/),
		replaceRules:SettingsGetReplacementRegularExpressionsArray()
	}

	console.log(g_processInputWorkspace.validWordJoiners)

	SetUpBadWordRules()
	SetUpNumberRules()
	CallTheseFunctions(TickProcessInput)
}

function TickProcessInternal()
{
	const txtInRaw = g_processInputWorkspace.inputTextArray.shift()

	if (txtInRaw)
	{
		try
		{
			Tally (g_profileAnalysis, "Input")
			const oldNumIssues = g_issueCount
			var txtInProcessed = txtInRaw.trim()

			if (txtInProcessed != txtInRaw)
			{
				IssueAdd("Paragraph starts and/or ends with space: " + FixStringHTML(txtInRaw), "LEADING OR TRAILING SPACE")
			}
			for (var {regex, replaceWith} of g_processInputWorkspace.replaceRules)
			{
				txtInProcessed = txtInProcessed.replace(regex, replaceWith)
			}
			if (txtInProcessed)
			{
				if (SettingsSayShouldProcess(txtInProcessed))
				{
					if (MarkupSaysShouldProcess(txtInProcessed))
					{
						if (ShouldProcessPara(txtInProcessed))
						{
							AnalyseParagraph(txtInRaw, txtInProcessed, oldNumIssues)
						}
					}
				}
			}
		}
		catch(error)
		{
			ShowError("While parsing " + txtInRaw + ":\n\n" + error.stack)
			return false
		}

		return true
	}

	return false
}

function TickProcessInput()
{
	Tally (g_profileAnalysis, "TimeSlice")
	for (var t = 0; t < 200; ++ t)
	{
		if (! TickProcessInternal())
		{
			g_onQueueEmpty.push(RemoveClickBlocker)
			CallTheseFunctions(GatherNameSuggestions, AfterProcessInput)
			return
		}
	}

	CallTheseFunctions(TickProcessInput)
}

function GatherNameSuggestions()
{
	const {suggestNameIfSeenThisManyTimes} = g_tweakableSettings
	g_entityNewNameSuggestions = []
	for (var [word, counts] of Object.entries(g_checkedWords))
	{
		if (word.length > 1 && counts.total >= suggestNameIfSeenThisManyTimes && ! (word in g_processInputWorkspace.checkedWordsSeenInLowerCase))
		{
			g_entityNewNameSuggestions.push({word:word, count:counts.total})
		}
	}
}

function AfterProcessInput()
{
	DoEvent("processingDone")
	g_processInputWorkspace = undefined
	if (g_selectedTabName != 'settings')
	{
		CallTheseFunctions(ShowContentForSelectedTab)
	}
}

function RemoveClickBlocker()
{
	document.getElementById("blocker").style.display="none"
}

function CheckFinalCharacter(txtIn, endsWithSpeech)
{
	const txtFull = txtIn
	var finalCharacter = txtIn.slice(-1)
	if (! endsWithSpeech)
	{
		while (finalCharacter.match(kSplitOnSpeechMarks) || finalCharacter == ')')
		{
			if (finalCharacter != ')')
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
