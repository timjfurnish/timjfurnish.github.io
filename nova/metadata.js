//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_metaDataCurrent
var g_metaDataInOrder
var g_metaDataAvailableColumns
var g_metaDataTally
var g_metaDataTotals
var g_metaDataCurrentCompleteness
var g_metaDataGatherParagraphs
var g_metaDataCurrentContainsToDo

const kMetaDataDefaultDisplay = MakeSet("Words", "Estimated final words", "Percent done")
const kMetaDataDefaultGroup = MakeSet("PART", "CHAPTER")

function MakeClearTally(createMentions)
{
	var reply =
	{
		Sentences:0,
		Paragraphs:0,
		Words:0,
		["Estimated final words"]:0,
		["Words in quotes"]:0,
		["Percent speech"]:0,
		["Percent done"]:0
	}
	
	if (createMentions)
	{
		reply.Mentions = {}
	}
	
	return reply
}

function MetaDataCombine(container, name, addThisValue)
{
	const addThisType = GetDataType(addThisValue)

	if (! (name in container))
	{
		console.log("Adding " + name + " data '" + addThisValue + "' of type " + addThisType + " to container that only contains this data: [" + Object.keys(container).join(", ") + "]")
		container[name] = (addThisType == "number") ? 0 : {}
	}

	const toHereType = GetDataType(container[name])

	if (toHereType == addThisType)
	{
		if (toHereType == "number")
		{
			container[name] += addThisValue
		}
		else
		{
			for (var [objName, objVal] of Object.entries(addThisValue))
			{
				Tally(container[name], objName, objVal)
			}
		}
	}
	else
	{
		console.warn("Can't add " + name + " data [" + addThisValue + "] of type " + addThisType + " to member [" + container[name] + "] of type " + toHereType)
	}
}

function MetaDataMakeFragmentDescription(fromThis)
{
	return Object.values(fromThis ?? g_metaDataCurrent).join(" | ")
}

function MetaDataEndProcess()
{
	if (g_metaDataTally.Sentences)
	{
		if (g_metaDataCurrentCompleteness < 100 && ! g_metaDataCurrentContainsToDo)
		{
			IssueAdd("Completeness is " + g_metaDataCurrentCompleteness + " but there's no TODO in this section", "TODO")
		}

		var info = {}
		for (var [key, val] of Object.entries(g_metaDataCurrent))
		{
			g_metaDataAvailableColumns[key] = true
			info[key] = val
		}
		
		var storeThis = {info:info, myParagraphs:g_metaDataGatherParagraphs}

		g_metaDataTally["Estimated final words"] = (g_metaDataTally.Words * 100) / g_metaDataCurrentCompleteness
	
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
		g_metaDataGatherParagraphs = []
	}
}

function MetaDataSet(key, val)
{
	MetaDataEndProcess()

	key = key.toUpperCase()

	// TODO: custom callback
	if (key == 'LOC')
	{
		const world = val.split('.', 1)[0]

		if (key in g_metaDataCurrent)
		{
			const old = g_metaDataCurrent[key]
			if (old.split('.', 1)[0] != world && old != 'sparks' && val != 'sparks' && old != 'movie' && val != 'movie' && old != 'log' && val != 'log')
			{
				IssueAdd("Moving from " + old + " to " + val, "ILLEGAL MOVE BETWEEN LOCATIONS")
			}
		}

		g_metaDataCurrent['WORLD'] = world
	}

	g_metaDataCurrent[key] = val
	g_metaDataCurrentContainsToDo = false
}

function MetaDataInformFoundToDo(foundInText)
{
	if (g_metaDataCurrentCompleteness >= 100)
	{
		IssueAdd("Completeness is " + g_metaDataCurrentCompleteness + " but there's a TODO in " + FixStringHTML(foundInText), "TODO")
	}

	g_metaDataCurrentContainsToDo = true
}

SetMarkupFunction('#', txt =>
{
	for (var setter of txt.split(';'))
	{
		MetaDataSet(...setter.split(':', 2))
	}
})

SetMarkupFunction('%', valueTxt =>
{
	const value = parseInt(valueTxt)

	if (value + "" != valueTxt)
	{
		IssueAdd("Ignoring bad completeness value " + valueTxt + ", should be an integer", "IGNORED COMPLETENESS")
	}
	else if (value < 1 || value > 100)
	{
		IssueAdd("Ignoring bad completeness value " + value + ", should be between 1 and 100 inclusive", "IGNORED COMPLETENESS")
	}
	else if (g_metaDataTally.Sentences)
	{
		IssueAdd("Ignoring badly placed completeness value " + value + " after already reading " + g_metaDataTally.Sentences + " sentences", "IGNORED COMPLETENESS")
	}
	else
	{
		g_metaDataCurrentCompleteness = value
	}
})

OnEvent("processingDone", MetaDataEndProcess)

OnEvent("clear", () =>
{
	g_metaDataCurrent = {CHAPTER:"None"}
	g_metaDataInOrder = []
	g_metaDataAvailableColumns = {}
	g_metaDataTally = MakeClearTally(true)
	g_metaDataTotals = MakeClearTally()
	g_metaDataCurrentCompleteness = 100
	g_metaDataGatherParagraphs = []
	g_metaDataCurrentContainsToDo = false
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

	const estimatedSize = g_metaDataTotals["Estimated final words"]
	if (estimatedSize)
	{
		reply.push("<H4>Complete: " + (100 * g_metaDataTotals.Words / estimatedSize).toFixed(2) + "%</H4>")
	}

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
				MetaDataCombine(lastTally, name, elem[name])
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

	// Calculate derived values (e.g. percentages) and max values
	for (var data of dataToDisplay)
	{
		data.tally["Percent speech"] = 100 * (data.tally["Words in quotes"] / data.tally.Words)
		data.tally["Percent done"] = 100 * (data.tally.Words / data.tally["Estimated final words"])
		
		for (var [name, val] of Object.entries(data.tally))
		{
			if (val > maximums[name])
			{
				maximums[name] = val
			}
		}
	}

	// Sort
	if (sort in maximums)
	{
		dataToDisplay.sort((a,b) => b.tally[sort] - a.tally[sort])
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
			else if (name.startsWith("Percent"))
			{
				contents = RenderBarFor(value, 100.0 / maximums[name], 2, '%')
			}
			else
			{
				contents = RenderBarFor(value, 200.0 / maximums[name], 0, ' (' + (100 * value / g_metaDataTotals[name]).toFixed(2) + '%)')
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
			if (g_metaDataTotals[name])
			{
				reply.push('<TD CLASS="cell">' + Math.round(g_metaDataTotals[name]) + '</TD>')				
			}
			else
			{
				reply.push('<TD CLASS="cell"></TD>')
			}
		}
	}
	
	reply.push("</TABLE>")
	document.getElementById("metaDataOutput").innerHTML = reply.join("")
}

TabDefine("metadata", TabFunctionStats, "Stats")

function TabFunctionStats(reply, thenCall)
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

	for (var name of Object.keys(emptyTally))
	{
		if (typeof emptyTally[name] == "number")
		{
			sortData[name] = name
		}

		OptionsMakeCheckbox(optionsDisplay, "MetaDataDrawTable()", "display_" + name, name, kMetaDataDefaultDisplay[name], true)
	}
	
//	console.log(sortData)

	OptionsMakeSelect(options, "MetaDataDrawTable()", "Sort", "sort", sortData, "none")

	reply.push(OptionsConcat(options))
	reply.push(OptionsConcat(optionsDisplay))
	reply.push("<P ID=metaDataOutput></P>")
	thenCall.push(MetaDataDrawTable)
}