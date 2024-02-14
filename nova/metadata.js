//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_metaDataCurrent
var g_metaDataInOrder
var g_metaDataAvailableColumns
var g_metaDataTally

function MakeClearTally()
{
	return {sentences:0, paragraphs:0, words:0, ["words in quotes"]:0}
}

function MetaDataEndProcess()
{
	if (g_metaDataTally.sentences)
	{
		var info = {}
		for (var [key, val] of Object.entries(g_metaDataCurrent))
		{
			g_metaDataAvailableColumns[key] = true
			info[key] = val
		}
		
//		console.log(g_metaDataTally.sentences + " sentences in " + Object.entries(info).join (" and "))
		
		var storeThis = {info:info}
	
		for (var key of Object.keys(g_metaDataTally))
		{
			storeThis[key] = g_metaDataTally[key]
			g_metaDataTally[key] = 0
		}

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
	g_metaDataTally = MakeClearTally()
})

function MetaDataProcessParagraph(numSentences)
{
	g_metaDataTally.sentences += numSentences
	++ g_metaDataTally.paragraphs
}

function MetaDataAddWordCount(words, isSpeech)
{
	g_metaDataTally.words += words
	
	if (isSpeech)
	{
		g_metaDataTally["words in quotes"] += words
	}
}

function MetaDataDrawTable()
{
	var sort = document.getElementById("metadata.sort").value
	var consolidate = sort ? {} : undefined
	var selectedColumns = []
	var reply = []
	var seenThings = {}

	TableOpen(reply)

	for (var colName of Object.keys(g_metaDataAvailableColumns))
	{
		if (document.getElementById("metadata." + colName).checked)
		{
			TableAddHeading(reply, colName)
			selectedColumns.push(colName)
			seenThings[colName] = {}
		}
	}
	
	var lastDeets = ""
	var lastTally = MakeClearTally()
	var dataToDisplay = []
	var lastMetaData = ""

	function AddLastDeets()
	{
		if (lastTally.paragraphs)
		{
			if (consolidate && lastDeets in consolidate)
			{
				for (var [name, val] of Object.entries(lastTally))
				{
					consolidate[lastDeets][name] += val
				}
				lastTally = consolidate[lastDeets]
//				console.log("Reusing entry for " + lastDeets)
			}
			else
			{
//				console.log("Creating entry for " + Object.entries(lastMetaData).join(" ") + " i.e. " + lastDeets)
				var newData = {deets:lastDeets, tally:lastTally, metaData:lastMetaData}

				dataToDisplay.push(newData)
				
				if (consolidate)
				{
					consolidate[lastDeets] = lastTally
				}
			}
		}
	}

//	console.log("MetaDataDrawTable - g_metaDataInOrder has " + g_metaDataInOrder.length + " elements")

	for (var elem of g_metaDataInOrder)
	{
		var deets = ''
		for (var colName of selectedColumns)
		{
			deets += "<TD>" + elem.info[colName] + "</TD>"
			
			seenThings[colName][elem.info[colName]] = true
		}
		if (deets != lastDeets)
		{
			AddLastDeets()

			lastTally = MakeClearTally()
			lastDeets = deets			
			lastMetaData = {}
			
			for (var colName of selectedColumns)
			{
				lastMetaData[colName] = elem.info[colName]
			}

			for (var name of Object.keys(lastTally))
			{
				lastTally[name] = elem[name]
			}
		}
		else
		{
			for (var name of Object.keys(lastTally))
			{
				lastTally[name] += elem[name]
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

	var maximums = MakeClearTally()
	maximums["%speech"] = 0
	
	if (sort in maximums)
	{
		dataToDisplay.sort((a,b) => b.tally[sort] - a.tally[sort])
	}

	for (var data of dataToDisplay)
	{
		data.tally["%speech"] = 100 * (data.tally["words in quotes"] / data.tally.words)
		
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
		if (name[0] == '%')
		{
			TableAddHeading(reply, "Percent " + name.substring(1))
		}
		else
		{
			TableAddHeading(reply, "Num " + name)
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
		for (var [name, value] of Object.entries(data.tally))
		{
			if (name[0] == '%')
			{
				reply.push("<TD>" + RenderBarFor(value, 100.0 / maximums[name], 2, '%') + "</TD>")
			}
			else
			{
				reply.push("<TD>" + RenderBarFor(value, 200.0 / maximums[name]) + "</TD>")
			}
		}

		// DEBUG
//		reply.push("<TD>" + Object.entries(data.metaData).join(" ") + "</TD>")
	}
	
	reply.push("</TABLE>")
	document.getElementById("metaDataOutput").innerHTML = reply.join("")
}

g_tabFunctions.metadata = function(reply, thenCall)
{
	var options = []
	const selectedColumns = Object.keys(g_metaDataAvailableColumns)

	for (var colName of selectedColumns)
	{
		OptionsMakeCheckbox(options, "MetaDataDrawTable()", colName)
	}

	var sortData = {"":"Do not consolidate", none:"Chronological"}
	var emptyTally = MakeClearTally()

	for (var name of Object.keys(emptyTally))
	{
		sortData[name] = name.charAt(0).toUpperCase() + name.slice(1)
	}
	
	OptionsMakeSelect(options, "MetaDataDrawTable()", "Sort", "sort", sortData, "none")

	reply.push(OptionsConcat(options))
	reply.push("<P ID=metaDataOutput></P>")
	thenCall.push(MetaDataDrawTable)
}