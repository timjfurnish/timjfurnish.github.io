var g_metaDataCurrent
var g_metaDataInOrder
var g_metaDataAvailableColumns
var g_metaDataTally

function MakeClearTally()
{
	return {sentences:0, paragraphs:0, words:0, ["words in quotes"]:0}
}

function MetaDataSet(key, val)
{
	MetaDataEndProcess()

	key = key.toUpperCase()

	// TODO: custom callback
	if (key == 'LOC')
	{
		const newBits = val.split('|')

		if (key in g_metaDataCurrent)
		{
			const oldBits = g_metaDataCurrent[key].split('|')
			if (oldBits[0] != newBits[0] && oldBits != 'sparks' && newBits != 'sparks' && oldBits != 'movie' && newBits != 'movie')
			{
				IssueAdd("Moving straight from " + oldBits + " to " + newBits)
			}
		}

		g_metaDataCurrent['WORLD'] = newBits[0]
	}

	g_metaDataCurrent[key] = val
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
		
		var storeThis = {info:info}
	
		for (var key of Object.keys(g_metaDataTally))
		{
			storeThis[key] = g_metaDataTally[key]
			g_metaDataTally[key] = 0
		}

		g_metaDataInOrder.push(storeThis)
	}
}

function MetaDataReset()
{
	g_metaDataCurrent = {}
	g_metaDataInOrder = []
	g_metaDataAvailableColumns = {}
	g_metaDataTally = MakeClearTally()
}

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
	var consolidate = document.getElementById("consolidate").checked ? {} : undefined
	var selectedColumns = []
	var reply = []
	TableOpen(reply)

	for (var colName of Object.keys(g_metaDataAvailableColumns))
	{
		if (document.getElementById(colName).checked)
		{
			TableAddHeading(reply, colName)
			selectedColumns.push(colName)
		}
	}
	
	var lastDeets = ""
	var lastTally = MakeClearTally()
	var dataToDisplay = []

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
			}
			else
			{				
				var newData = {deets:lastDeets, tally:lastTally}

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
			deets += "<TD>" + elem.info[colName] + "</TD>"
		}
		if (deets != lastDeets)
		{
			AddLastDeets()

			lastTally = MakeClearTally()
			lastDeets = deets

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

	var maximums = MakeClearTally()
	maximums["%speech"] = 0

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
		TableNewRow(reply)
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

	OptionsMakeCheckbox(options, "MetaDataDrawTable()", "consolidate", "Consolidate totals")

	reply.push(OptionsConcat(options))
	reply.push("<P ID=metaDataOutput></P>")
	thenCall.push(MetaDataDrawTable)
}