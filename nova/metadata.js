//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_metaDataCurrent
var g_metaDataInOrder
var g_metaDataAvailableColumns
var g_metaDataTally
var g_metaDataTotals

const kMetaDataDefaultDisplay = MakeSet("Words", "Estimated final words")
const kMetaDataDefaultGroup = MakeSet("PART", "CHAPTER")

function MakeClearTally(createMentions)
{
	var reply = {Sentences:0, Paragraphs:0, Words:0, ["Estimated final words"]:0, ["Words in quotes"]:0}
	
	if (createMentions)
	{
		reply.Mentions = {}
	}
	
	return reply
}

function MetaDataEndProcess()
{
	if (g_metaDataTally.Sentences)
	{
		var info = {}
		for (var [key, val] of Object.entries(g_metaDataCurrent))
		{
			g_metaDataAvailableColumns[key] = true
			info[key] = val
		}
		
		var storeThis = {info:info}

		const completenessPercentage = parseInt(g_metaDataCurrent?.COMPLETENESS ?? "100")
		g_metaDataTally["Estimated final words"] = Math.round((g_metaDataTally.Words * 100) / completenessPercentage)
	
		for (var [key, val] of Object.entries(g_metaDataTally))
		{
			if (typeof val == "number")
			{
				storeThis[key] = val
				g_metaDataTotals[key] += val
			}
			else
			{
				storeThis[key] = {}
				
				for (var [k, v] of Object.entries(val))
				{
//					console.log(key + ": " + k + "=" + v)
					Tally(storeThis[key], k, v)
				}
			}
		}

		g_metaDataTally = MakeClearTally(true)
		g_metaDataInOrder.push(storeThis)
	}
}

function MetaDataSet(key, val)
{
	MetaDataEndProcess()

	key = key.toUpperCase()

	// TODO: custom callback
	if (key == 'LOC')
	{
		const newBits = val.split('.')

		if (key in g_metaDataCurrent)
		{
			const oldBits = g_metaDataCurrent[key].split('.')
			if (oldBits[0] != newBits[0] && oldBits != 'sparks' && newBits != 'sparks' && oldBits != 'movie' && newBits != 'movie')
			{
				IssueAdd("Moving straight from " + oldBits + " to " + newBits)
			}
		}

		g_metaDataCurrent['WORLD'] = newBits[0]
	}

	g_metaDataCurrent[key] = val
}

OnEvent("processingDone", MetaDataEndProcess)

OnEvent("clear", () =>
{
	g_metaDataCurrent = {}
	g_metaDataInOrder = []
	g_metaDataAvailableColumns = {}
	g_metaDataTally = MakeClearTally(true)
	g_metaDataTotals = MakeClearTally()
})

function MetaDataProcessParagraph(numSentences)
{
	g_metaDataTally.Sentences += numSentences
	++ g_metaDataTally.Paragraphs
}

function MetaDataAddWordCount(words, isSpeech)
{
	g_metaDataTally.Words += words
	
	if (isSpeech)
	{
		g_metaDataTally["Words in quotes"] += words
	}
}

function MetaDataIncreaseCount(counterName)
{
	Tally(g_metaDataTally.Mentions, counterName)
}

function MetaDataDrawTable()
{
	var sort = document.getElementById("metadata.sort").value
	var consolidate = sort ? {} : undefined
	var selectedColumns = []
	var selectedDisplay = []
	var reply = []
	var seenThings = {}

	TableOpen(reply)

	for (var colName of Object.keys(g_metaDataAvailableColumns))
	{
		if (g_currentOptions.metadata["process_" + colName])
		{
			TableAddHeading(reply, colName)
			selectedColumns.push(colName)
			seenThings[colName] = {}
		}
	}
	
	var lastDeets = ""
	var lastTally = MakeClearTally(true)
	var dataToDisplay = []
	var lastMetaData = ""

//	console.log("============================")

	function AddLastDeets()
	{
		if (lastTally.Paragraphs)
		{
//			console.log("  > " + lastDeets + ": " + Object.entries(lastTally.Mentions).join(' '))

			if (consolidate && lastDeets in consolidate)
			{
				var addLastTallyToHere = consolidate[lastDeets]

				for (var [name, val] of Object.entries(lastTally))
				{
					if (typeof val == "number")
					{
						addLastTallyToHere[name] += val
					}
					else
					{
						for (var [objName, objVal] of Object.entries(val))
						{
							Tally(addLastTallyToHere[name], objName, objVal)
						}
					}
				}

				lastTally = addLastTallyToHere
//				console.log("    Reusing entry for " + lastDeets)
			}
			else
			{
//				console.log("   Creating entry for '" + Object.entries(lastMetaData).join(" ") + "' i.e. '" + lastDeets + "'")
				var newData = {deets:lastDeets, tally:lastTally, metaData:lastMetaData}

				dataToDisplay.push(newData)
				
				if (consolidate)
				{
					consolidate[lastDeets] = lastTally
				}
			}
		}
	}

	for (var elem of g_metaDataInOrder)
	{
		var deets = ''
		
		for (var colName of selectedColumns)
		{
			deets += "<TD CLASS=cellNoWrap>" + elem.info[colName] + "</TD>"
			
			seenThings[colName][elem.info[colName]] = true
		}

//		console.log("[D] " + Object.entries(elem.Mentions).join(' '))
		
		if (deets != lastDeets)
		{
			AddLastDeets()

			lastTally = MakeClearTally(true)
			lastDeets = deets			
			lastMetaData = {}
			
			for (var colName of selectedColumns)
			{
				lastMetaData[colName] = elem.info[colName]
			}

			for (var name of Object.keys(lastTally))
			{
				var val = elem[name]

				if (typeof val == "number")
				{
					lastTally[name] = val
				}
				else
				{
					lastTally[name] = {}
					
					for (var [k, v] of Object.entries(val))
					{
//						console.log(name + ": " + k + "=" + v)
						Tally(lastTally[name], k, v)
					}
				}
			}
		}
		else
		{
			for (var name of Object.keys(lastTally))
			{
				const val = elem[name]

				if (typeof val == "number")
				{
					lastTally[name] += val
				}
				else
				{
					for (var [objName, objVal] of Object.entries(val))
					{
						Tally(lastTally[name], objName, objVal)
					}
				}
			}
		}
	}

	AddLastDeets()

	// Now work out which of the visible metadata types has the fewest entries
//	console.log(seenThings)

	var colourBasedOn
	var lowestSize

	for (var [key,val] of Object.entries(seenThings))
	{
		var total = Object.keys(val).length
		if (!colourBasedOn || total < lowestSize)
		{
			lowestSize = total
			colourBasedOn = key
		}
	}

	const colourLookUp = colourBasedOn ? MakeColourLookUpTable(Object.keys(seenThings[colourBasedOn])) : null

	var maximums = MakeClearTally(false)
	maximums["Percent speech"] = 0
	
	if (sort in maximums)
	{
		dataToDisplay.sort((a,b) => b.tally[sort] - a.tally[sort])
	}

	for (var data of dataToDisplay)
	{
		data.tally["Percent speech"] = 100 * (data.tally["Words in quotes"] / data.tally.Words)
		
		for (var [name, val] of Object.entries(data.tally))
		{
			if (val > maximums[name])
			{
				maximums[name] = val
			}
		}
	}

	for (var name of Object.keys(lastTally))
	{
		if (g_currentOptions.metadata["display_" + name])
		{
			TableAddHeading(reply, name)
			selectedDisplay.push(name)
		}
	}

	for (var data of dataToDisplay)
	{
		if (colourBasedOn)
		{
			TableNewRow(reply, 'BGCOLOR="' + colourLookUp[data.metaData[colourBasedOn]] + '"')
		}
		else
		{
			TableNewRow(reply)
		}
		reply.push(data.deets)
		for (var name of selectedDisplay)
		{
			var value = data.tally[name]
			var contents = ""

			if (typeof value == "object")
			{
				contents = Object.keys(value).join(" ")
			}
			else if (name == "Percent speech")
			{
				contents = RenderBarFor(value, 100.0 / maximums[name], 2, '%')
			}
			else
			{
				contents = RenderBarFor(value, 200.0 / maximums[name])
			}

			reply.push("<TD CLASS=cell>" + contents + "</TD>")
		}

		// DEBUG
//		reply.push("<TD CLASS=cell>" + Object.entries(data.metaData).join(" ") + "</TD>")
	}

	// Only need to display total if we had any columns selected...
	if (selectedColumns.length)
	{
		reply.push('<TR><TD COLSPAN="' + selectedColumns.length + '" CLASS="cellNoWrap"><B><SMALL>TOTAL:</SMALL></B></TD>')

		for (var name of selectedDisplay)
		{
			if (name in g_metaDataTotals)
			{
				reply.push('<TD CLASS="cell">' + g_metaDataTotals[name] + '</TD>')				
			}
			else
			{
				reply.push('<TD CLASS="cell"></TD>')
			}
		}
	}
	
	reply.push("</TABLE>")
	const estimatedSize = g_metaDataTotals["Estimated final words"]
	if (estimatedSize)
	{
		reply.push("<H4>Complete: " + (100 * g_metaDataTotals.Words / estimatedSize).toFixed(2) + "%</H4>")
	}
	document.getElementById("metaDataOutput").innerHTML = reply.join("")
}

g_tabFunctions.metadata = function(reply, thenCall)
{
	var options = []
	var optionsDisplay = []
	const selectedColumns = Object.keys(g_metaDataAvailableColumns)

	for (var colName of selectedColumns)
	{
		OptionsMakeCheckbox(options, "MetaDataDrawTable()", "process_" + colName, colName, kMetaDataDefaultGroup[colName], true)
	}

	var sortData = {"":"Do not consolidate", none:"Chronological"}
	var emptyTally = MakeClearTally(true)
	emptyTally["Percent speech"] = undefined

	for (var name of Object.keys(emptyTally))
	{
		if (typeof emptyTally[name] == "number")
		{
			sortData[name] = name.charAt(0).toUpperCase() + name.slice(1)
		}

		OptionsMakeCheckbox(optionsDisplay, "MetaDataDrawTable()", "display_" + name, name, kMetaDataDefaultDisplay[name], true)
	}
	
	OptionsMakeSelect(options, "MetaDataDrawTable()", "Sort", "sort", sortData, "none")

	reply.push(OptionsConcat(options))
	reply.push(OptionsConcat(optionsDisplay))
	reply.push("<P ID=metaDataOutput></P>")
	thenCall.push(MetaDataDrawTable)
}