var g_sentences = null
var g_headingToSentence = null
var g_numParagraphsProcessed = 0
var g_numHeadings = 0
var g_nameLookup = {}
var g_txtInArray = []
var g_numInputBoxes = 0

const kIllegalSubstrings = [["tab character", "\t"], ["double apostrophe", "''"], ["double quote", "\"\""], ["double space", "  "], ["dubious punctuation combo", /[;:,\.\!\?][;:,\.]/g], ["em dash", "\u8212"], ["split infinitive", / to [a-z]+ly /i]]
const kIllegalSubstringsExceptions = {[" to apply "]:true}

function SetUp_FixTitle()
{
	const location = document.location.href

	if (location.substr(0, 4) == "file")
	{
		document.title += " (LOCAL)"
	}
}

function CallTheseFunctions(list)
{
	for (const func of list)
	{
		try
		{
			func()
		}
		catch(err)
		{
			ShowError("While calling " + func.name + ":\n\n" + err.stack)
		}
	}
}

function SetUp()
{
	CallTheseFunctions([BuildTabs, SetUp_FixTitle, SettingsLoad])

	for (var i = 0; i < g_tweakableSettings.numTextBoxes; ++ i)
	{
		addInputBox(false)
	}

	setTimeout(ProcessInput, 0)
}

function addInputBox(saveIt)
{
	document.getElementById('inputs').innerHTML += '<textarea id="txtIn' + ++ g_numInputBoxes + '" cols=140 rows=10 onChange="ProcessInput()"></textarea><BR>'
	
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

function Highlighter(matched)
{
	return "<span style=\"background-color:yellow\">" + matched + "</span>"
}

function CheckParagraphForIssues(txtIn)
{
	txtIn = txtIn.replace(/[\(\)]/g, '')

	for (var [k,v] of kIllegalSubstrings)
	{
		const changed = txtIn.replace(v, matched => (matched in kIllegalSubstringsExceptions) ? matched : Highlighter(matched))
		if (changed != txtIn)
		{
			IssueAdd("Found " + k + " in '" + changed + "'")
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
	
	if ((txtIn.split('"').length & 1) == 0)
	{
		IssueAdd("Found odd number of quotation marks in '" + txtIn + "'")	
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
					if (name in gatherHere.mentions)
					{
						++ gatherHere.mentions[name]
					}
					else
					{
						gatherHere.mentions[name] = 1
					}
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

function ProcessInput()
{
	g_txtInArray = GetInputText()

	g_sentences = []
	g_headingToSentence = []
	
	IssueClear()
	MetaDataReset()

	for (var resetLongest of Object.values(g_longest))
	{
		resetLongest.num = 0
		resetLongest.what = null
	}

	const kSpecificOnlyAHeadingIfIncludes = g_tweakableSettings.headingIdentifier

	var gatherHeadingStatsHere = null
	var numParagraphsProcessed = 0
	var numParagraphsIgnored = 0
	
	var workspace =
	{
		stillLookingForChapterNameInChapter:null,
		numHeadings:0,
		lastHeading:null,
		badWords:{}
	}
	
	for (var w of g_tweakableSettings.badWords.split(" "))
	{
		workspace.badWords[w] = true
	}

	g_nameLookup = {}

	for (var nameList of SettingsGetNamesArrayArray())
	{
		for (var name of nameList)
		{
			g_nameLookup[name] = nameList[0]
		}
	}

	for (txtInRaw of g_txtInArray)
	{
		try
		{
			txtInRaw.startsWith(" ") && IssueAdd("Found leading space in '" + txtInRaw + "'")
			txtInRaw.endsWith(" ") && IssueAdd("Found trailing space in '" + txtInRaw + "'")

			const txtIn = txtInRaw.replace(/["\.\!\?;=]+ */g, '|').replace(/\u2026/g, '|').replace(/:$/, '').replace(/\|$/, '').replace(/^\|/, '').replace(/\^/g, '.')

			if (txtIn === "" || txtIn === "" + Number(txtIn) || SettingsSayShouldIgnore(txtIn))
			{
				continue
			}

			if (txtIn[0] == '#')
			{
				MetaDataSet(...txtIn.substring(1).split(':'))
				continue
			}
			else if (txtIn[0] == '@')
			{
				WarningEnableDisable(txtIn.substring(1))
				continue
			}

			const isAHeading = (kSpecificOnlyAHeadingIfIncludes ? txtIn.includes(kSpecificOnlyAHeadingIfIncludes) : (txtIn == txtInRaw))

			if (!isAHeading)
			{
				workspace.foundTextBetweenHeadings = true

				CheckParagraphForIssues(txtInRaw)
				
				const sentences = OnlyKeepValid(txtIn.split("|"))

				if (workspace.stillLookingForChapterNameInChapter)
				{
					const putBackTogether = sentences.join(' ').toLowerCase()
					if (putBackTogether.includes(workspace.stillLookingForChapterNameInChapter))
					{
						workspace.stillLookingForChapterNameInChapter = null
					}
				}

				const numSentences = sentences.length

				if (numSentences)
				{
					MetaDataProcessParagraph(numSentences)

					++ numParagraphsProcessed
					
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
						++ workspace.numHeadings
					}
					
					var numWordsInPara = 0
					var prefixMe = '^'

					// BAH
					for (var s of sentences)
					{
						s = s.replace(/^'+/, "").replace(/'+$/, "")
						const listOfWords = OnlyKeepValid(s.toLowerCase().split(/[^#'a-z0-9\&]+/))

						if (listOfWords.length)
						{
							CheckIfLongest("sentence", listOfWords.length, s)
							CheckIfLongest("sentenceChr", listOfWords.join(' ').length, s)

							numWordsInPara += listOfWords.length
							MetaDataAddWordCount(listOfWords.length)
							
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
									newListOfWords.push(w)
									CheckEachWord(w.split(/[-']/), s, workspace, gatherHeadingStatsHere)
								}
								else
								{
									IssueAdd("Empty word in '" + s + "'")
								}
							}
							
							g_sentences.push({text:prefixMe + s, listOfWords:newListOfWords})
							prefixMe = ''
						}
					}

					CheckIfLongest("paraSentences", numSentences, sentences)
					CheckIfLongest("paraWords", numWordsInPara, sentences)
					CheckIfLongest("paraChr", txtIn.length, sentences)
				}
			}
			else
			{
				++ numParagraphsIgnored
			
				DoEndOfChapterChesks(workspace)
				IssueSetHeading(txtInRaw)

				const justChapterName = txtInRaw.split(/ *[\[\(]/)[0].toLowerCase()

				workspace.lastHeading = txtInRaw
				workspace.stillLookingForChapterNameInChapter = justChapterName
				MetaDataSet("CHAPTER", justChapterName)
				delete workspace.foundTextBetweenHeadings
			}
		}
		catch(error)
		{
			ShowError("While parsing " + txtInRaw + ":\n\n" + error.stack)
		}
	}
	
	DoEndOfChapterChesks(workspace)
	MetaDataEndProcess()

	g_numParagraphsProcessed = numParagraphsProcessed
	g_numHeadings = workspace.numHeadings

	SetSentenceNum(0)
	ShowContentForSelectedTab()
	IssuesUpdateTabText()
}

function DoEndOfChapterChesks(workspace)
{
	if (workspace.stillLookingForChapterNameInChapter && workspace.foundTextBetweenHeadings)
	{
		IssueAdd("Didn't find chapter name in chapter '" + workspace.stillLookingForChapterNameInChapter + "'")
	}
}

