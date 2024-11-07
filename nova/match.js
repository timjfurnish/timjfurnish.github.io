//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

const kMaxLookAhead = 4
const kMaxIssuesPerSection = 4

/*
OnEvent("clear", true, () =>
{
})
*/

function MatchHighlightStringDifferences(before, after)
{
	var beforeBits = before.split(' ')
	var afterBits = after.split(' ')
	var output = []
	var addToEnd = []
	
	while (beforeBits.length && afterBits.length)
	{
		if (beforeBits[0] != afterBits[0])
		{
			break
		}

		output.push(beforeBits.shift())
		afterBits.shift()
	}
	
	while (beforeBits.length && afterBits.length)
	{
		if (beforeBits[beforeBits.length - 1] != afterBits[afterBits.length - 1])
		{
			break
		}
		
		addToEnd.unshift(beforeBits.pop())
		afterBits.pop()
	}
	
	output.push('<FONT CLASS="MatchRemove">' + afterBits.join(' ') + '</FONT> <FONT CLASS="MatchAdd">' + beforeBits.join(' ') + '</FONT>')
	output.push(...addToEnd)
	return output.join(' ')
}

function MatchCompare()
{
	const reply = []

	if (g_currentOptions.match.chunks != '')
	{
		const compareRaw = document.getElementById('compareWithThis').value.replace(/\</g, '[').replace(/\>/g, ']').replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'").split(/[\n]+/)
		const replaceRules = SettingsGetReplacementRegularExpressionsArray()
		
		var currentChunkName = null
		var issuesWithThisRow = []
		var numOkParagraphs = 0
		var numIssues = 0
		
		function WriteMatchRow()
		{
			if (currentChunkName === null)
			{
			}
			else if (issuesWithThisRow.length)
			{
				TableNewRow(reply, "#FFEEEE", "valign=top")
				TableAddCell(reply, currentChunkName)
				TableAddCell(reply, issuesWithThisRow.join("<HR>"), true)
			}
			else
			{
				TableNewRow(reply)
				TableAddCell(reply, currentChunkName)
				TableAddCell(reply, "OK (" + numOkParagraphs + " paragraphs)", true)
			}

			issuesWithThisRow = []
		}

		TableOpen(reply)
		TableAddHeading(reply, g_currentOptions.match.chunks)
		TableAddHeading(reply, "Result")

		for (var {info, myParagraphs} of g_metaDataInOrder)
		{
			if (g_currentOptions.match.chunks in info)
			{
				const thisChunkName = info[g_currentOptions.match.chunks]

				if (currentChunkName != thisChunkName)
				{
					WriteMatchRow()

					function GetLineToSkip()
					{
						if (compareRaw.length == 0)
						{
							return null
						}

						var txtInProcessed = compareRaw.shift()
						for (var {regex, replaceWith} of replaceRules)
						{
							txtInProcessed = txtInProcessed.replace(regex, replaceWith)
						}
						return txtInProcessed
					}
					
					var skipLine = GetLineToSkip()
					while (thisChunkName != skipLine && skipLine !== null)
					{
						skipLine = GetLineToSkip()
					}
					
					currentChunkName = thisChunkName
					numOkParagraphs = 0
					numIssues = 0

					if (skipLine === null)
					{
						issuesWithThisRow.push('<FONT COLOR=purple>Failed to find start of ' + g_currentOptions.match.chunks + ' "' + thisChunkName + '"</FONT>')
						break
					}
				}
				
				if (issuesWithThisRow)
				{
					for (var pNum = 0; pNum < myParagraphs.length; ++ pNum)
					{
						var line = myParagraphs[pNum]
						var shouldMatch = compareRaw.shift()

						if (! shouldMatch)
						{
							issuesWithThisRow.push('<FONT COLOR=purple>Document ended while expecting "' + line.allOfIt + '"</FONT>')
							break;
						}
						else if (line.allOfIt != shouldMatch)
						{
							var solved = false

							// FIRST CHECK: Look ahead in compareRaw for a line that matches line.allOfIt!
							for (var j = 0; j < kMaxLookAhead; ++ j)
							{
								if (line.allOfIt == compareRaw[j])
								{
//									issuesWithThisRow.push('compareRaw was ' + compareRaw)
									while (j-- >= 0)
									{
										issuesWithThisRow.push('<FONT CLASS="MatchRemove">' + shouldMatch + '</FONT>')
										shouldMatch = compareRaw.shift()
									}
//									issuesWithThisRow.push('compareRaw is now ' + compareRaw)
//									issuesWithThisRow.push('Hopefully ' + myParagraphs[pNum + 1]?.allOfIt + ' == ' + compareRaw[0])
									solved = true
									break
								}
							}

							if (! solved)
							{
								// SECOND CHECK: Look ahead in myParagraphs for a line that shouldMatch!
								for (var j = 0; j < kMaxLookAhead; ++ j)
								{
									if (myParagraphs[pNum + j + 1]?.allOfIt == shouldMatch)
									{
										const stopHere = pNum + j
										while (pNum <= stopHere)
										{
											issuesWithThisRow.push('<FONT CLASS="MatchAdd">' + myParagraphs[pNum].allOfIt + '</FONT>')
											++pNum
										}
//										issuesWithThisRow.push('Hopefully ' + myParagraphs[pNum]?.allOfIt + ' == ' + shouldMatch + ' and ' + myParagraphs[pNum + 1]?.allOfIt + ' == ' + compareRaw[0])
										solved = true
										break
									}
								}
							
								if (! solved)
								{
									// LAST RESORT: Show differences between line.allOfIt and shouldMatch
									issuesWithThisRow.push(MatchHighlightStringDifferences(line.allOfIt, shouldMatch))
								}
							}
						}
						else
						{
							++ numOkParagraphs
						}
					}
				}
			}
		}
		
		WriteMatchRow()
	}

	UpdateArea('matchOutput', reply.join(''))
}

async function MatchInputPaste()
{
	const theText = await navigator.clipboard.readText()
	document.getElementById("compareWithThis").value = theText
	CallTheseFunctions(MatchCompare)
}

TabDefine("match", function(reply, thenCall)
{
	var options = []
	var chunkOptions = {[""]:""}
	Object.keys(g_metaDataAvailableColumns).forEach(name => chunkOptions[name] = name)
	OptionsMakeSelect(options, "MatchCompare()", "Chunk using", "chunks", chunkOptions, "", true)	
	OptionsMakeButtons(options, {Clear:"document.getElementById('compareWithThis').value = ''; MatchCompare()", Paste:"MatchInputPaste()"})
	reply.push(OptionsConcat(options) + "<BR>")
	reply.push('<textarea class="docIn" id="compareWithThis" onChange="MatchCompare()"></textarea>')
	MakeUpdatingArea(reply, "matchOutput", 'style="user-select:text"')
	thenCall.push(MatchCompare)
}, {icon:kIconMatch, tooltipText:"Does it match?"})