//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_profileAnalysis = {}
var g_processInputWorkspace
var g_checkedWords = {}

const kReplaceOnlyKeepBraces      =  /[^‘’\u201C\u201D\[\]\{\}\(\)]/g // And opening/closing quotes
const kReplaceFullStops           =  /\./g
const kReplaceCarats              =  /\^/g
const kReplaceSentenceStartStuff  =  /^['‘\u2026]+/
const kReplaceSentenceEndStuff    =  /[,'’—\u2026]+$/
const kRemoveWordStartPunc        =  /^[\-'‘’]+/
const kRemoveWordEndPunc          =  /[\-'’]+$/

const kSplitToCheckForGappyPunctuation  =  /[\.,;:!\?]+["\u201D\)]?/
const kSplitIntoFragments               =  /([\|\!\?;:]+) */
const kSplitOnSpeechMarks               =  /[\u201C\u201D"]/

const kBraces = {['‘']:'’', ['{']:'}', ['[']:']', ['(']:')', ['\u201C']:'\u201D'}

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
	for (var myReg of g_processInputWorkspace.numberRules)
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
	["numbers", /#?[A-Z\/\-\.]*[0-9]+[A-Z\/\-0-9]*/gi, ShouldIgnoreNumberFoundInText],
	["misused hyphen", /( \-)|(\- )/g],
	["misused opening quote", /[^“\( ][‘“]/g],
	["double space", "  "],
	["dubious punctuation combo", /[;:\-,\.\!\?][;:\-,\.\!\?]/g, txt => txt == "!?"],
	["space before punctuation", / [;:,\.\!\?]/g],
	["split infinitive", /\bto (not|never|always|almost|[a-z][a-z]+ly) [a-z][a-z]+/gi, txt => g_tweakableSettings.splitInfinitiveIgnoreList.includes(txt)],
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
			const {tag, characters, numericalCheck, clearTags, includeLineInText, joinNextLine} = autoTagSettings
			var storeAs = withoutKey.trim()

			if (characters)
			{
				storeAs = storeAs.replace(new RegExp('[' + EscapeRegExSpecialChars(characters) + ']', 'g'), "")
			}
			
			if (joinNextLine)
			{
				storeAs += " " + g_processInputWorkspace.inputTextArray.shift()
			}

//			console.log ("Found auto-tag '" + tag + "' in line '" + txtInProcessed + "' - storing as '" + storeAs + "'")
						
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

			if (includeLineInText)
			{
				g_metaDataTally.Words += OnlyKeepValid(txtInProcessed.split(g_processInputWorkspace.regexForSplittingIntoWords)).length
				++ g_metaDataTally.Paragraphs

				if (g_metaDataGatherParagraphs.length == 0)
				{
					g_metaDataCurrentCompleteness = g_metaDataNextCompleteness
					g_metaDataNextCompleteness = 100
				}

				g_metaDataGatherParagraphs.push({allOfIt:txtInProcessed, fragments:[{text:txtInProcessed, followedBy:""}]})
			}

			return false
		}
	}
	
	return true
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
	var allowedInWords = "-.%#'‘’&0123456789"

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

	const matchThis = '[^' + EscapeRegExSpecialChars(allowedInWords) + ']+'
	return new RegExp(matchThis, 'i')
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

function AnalyseParagraph(txtInRaw, txtInProcessed, oldNumIssues)
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

	CheckStringForEvenBraces(txtInProcessed)
	
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
				
				s = s.replace(kReplaceSentenceStartStuff, "").replace(kReplaceSentenceEndStuff, "")
				const myListOfWords = OnlyKeepValid(s.split(g_processInputWorkspace.regexForSplittingIntoWords))
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
									IssueAdd("Expected " + FixStringHTML(word) + " to start with a capital letter " + shouldStartWithCapital + " " + FixStringHTML(thisBunchOfFragments), "CAPITALS")
								}
							}
							
							shouldStartWithCapital = CheckEachWord(word, s, isSpeech) && ("following " + word + " in")
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

	g_profileAnalysis = {}
	g_checkedWords = {}

	g_processInputWorkspace =
	{
		checkedWordsSeenInLowerCase:{},
		plainBadWords:{},
		numberRules:[],
		badWordRegExpressions:[],
		regexForRemovingValidChars:new RegExp('[' + EscapeRegExSpecialChars(g_tweakableSettings.allowedCharacters) + ']', 'g'),
		treatNextParagraphAsSpeech:false,
		regexForSplittingIntoWords:MakeRegexForSplittingIntoWords(),
		inputTextArray:GetInputText().split(/[\n]+/),
		replaceRules:SettingsGetReplacementRegularExpressionsArray()
	}

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
