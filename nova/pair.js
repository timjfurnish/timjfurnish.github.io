//==============================================
// Part of Nova - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

var g_currentPairName
var g_currentPairSectionName
var g_pairFragmentTally
var g_collectPairStuffToHere = null
var g_pairData
var g_pairBit

OnEvent("clear", false, () =>
{
	Assert(g_currentPairName === undefined, "g_currentPairName is not undefined, it's " + g_currentPairName)
	Assert(g_currentPairSectionName === undefined, "g_currentPairSectionName is not undefined, it's " + g_currentPairSectionName)
	Assert(g_collectPairStuffToHere === null, "g_collectPairStuffToHere is not null, it's " + g_collectPairStuffToHere)
	g_pairData = {}
})

function PairEndReadingSection()
{
	g_currentPairName = undefined
	g_currentPairSectionName = undefined
	g_pairFragmentTally = undefined
	g_pairBit = undefined
	g_collectPairStuffToHere = null
}

OnEvent("processingDone", false, () =>
{
	if (g_collectPairStuffToHere)
	{
		PairEndReadingSection()
	}

	for (var myData of Object.values(g_pairData))
	{
		var needColourFor = []
		for (var [name, value] of Object.entries(myData.fragmentCounts))
		{
			if (value & (value - 1))
			{
				needColourFor.push(name)
			}
		}

		myData.colours = MakeColourLookUpTable(needColourFor, 0.2)
		delete myData.fragmentCounts
	}
})

TabDefine("pairs", function(reply, thenCall)
{
	if (TabBuildButtonsBar(reply, Object.keys(g_pairData)))
	{
		const myData = g_pairData[g_currentOptions.pairs.page]

		Assert(myData, "Found no pair data")

		TableOpen(reply)
		TableAddHeading(reply, "")

		for (var elem of myData.arr)
		{
			TableAddHeading(reply, elem.where)
		}

		for (var r of Object.keys(myData.allSectionNames))
		{
			var myBit = 1
			TableNewRow(reply)
			TableAddHeading(reply, r)

			for (var columnData of myData.arr)
			{
				var cellContents = []
				const showThisText = columnData.contents[r]
				if (showThisText)
				{
					for (var eachLine of showThisText)
					{
						var paraContents = []
						var wasSpeech = undefined
						var lastFollowedBy = undefined
						var joiner = ''
						for (var eachFrag of eachLine)
						{
							var {text, isSpeech, followedBy} = eachFrag

							if (wasSpeech != isSpeech)
							{
								if (wasSpeech)
								{
									if (lastFollowedBy == '')
									{
										joiner = ',"' + joiner
									}
									else
									{
										joiner = '"' + joiner
									}
								}
								else if (text[0] == ' ')
								{
									joiner += '"' + kCharacterElipsis
								}
								else
								{
									joiner += '"'
								}
							}
							const colour = myData.colours[text.toLowerCase().trim()]

							if (colour)
							{
								text = Highlighter(text, colour)
							}
							paraContents.push(joiner + text + followedBy)
							wasSpeech = isSpeech
							joiner = ' '
							lastFollowedBy = followedBy
						}
						cellContents.push(kIndent + paraContents.join('') + (wasSpeech ? lastFollowedBy ? '"' : (kCharacterEmDash + '"') : ''))
					}
				}
				TableAddCell(reply, cellContents.join('<BR>'), true)
				myBit <<= 1
			}
		}

		TableClose(reply)
	}
	else
	{
		reply.push("No pair data found")
	}
}, {icon:kIconPair, canSelect:true})

function PairDoneParagraph(pushThis)
{
	if (g_currentPairSectionName)
	{
		for (var fragment of pushThis.fragments)
		{
			SetBit(g_pairFragmentTally, fragment.text.toLowerCase().trim(), g_pairBit)
		}

		if (g_currentPairSectionName in g_collectPairStuffToHere)
		{
			g_collectPairStuffToHere[g_currentPairSectionName].push(pushThis.fragments)
		}
		else
		{
			g_collectPairStuffToHere[g_currentPairSectionName] = [pushThis.fragments]
		}
	}
}

SetMarkupFunction('^', txt =>
{
	const [key, value] = txt.split(':', 2)

	if (key)
	{
		if (g_currentPairName && (key != g_currentPairName || !value))
		{
			PairEndReadingSection()
		}

		if (value)
		{
			if (g_currentPairName == undefined)
			{
				g_collectPairStuffToHere = []
				const whereAreWe = g_metaDataCurrent.CHAPTER
				const newElement = {where:whereAreWe, contents:g_collectPairStuffToHere}
				if (key in g_pairData)
				{
					g_pairBit = 1 << g_pairData[key].arr.length
					g_pairData[key].arr.push(newElement)
					g_pairFragmentTally = g_pairData[key].fragmentCounts
				}
				else
				{
					g_pairBit = 1
					g_pairFragmentTally = {}
					g_pairData[key] = {arr:[newElement], allSectionNames:{}, fragmentCounts:g_pairFragmentTally}
				}
				g_currentPairName = key
			}

			if (value == '-')
			{
				g_currentPairSectionName = undefined
			}
			else
			{
				g_currentPairSectionName = value

				if (value in g_collectPairStuffToHere)
				{
					g_collectPairStuffToHere[value].push([{text:"<HR WIDTH=50%>", followedBy:""}])
				}
				g_pairData[key].allSectionNames[value] = true
			}
		}
	}
})
