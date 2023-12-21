var g_metaDataCurrent
var g_metaDataInOrder
var g_metaDataAvailableColumns
var g_metaDataTally

function MakeClearTally()
{
	return {Sentences:0, Paragraphs:0, Words:0}
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
	if (g_metaDataTally.Sentences)
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
	g_metaDataTally.Sentences += numSentences
	++ g_metaDataTally.Paragraphs
}

function MetaDataAddWordCount(words)
{
	g_metaDataTally.Words += words
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
	var maximums = MakeClearTally()
	var dataToDisplay = []

	function AddLastDeets()
	{
		if (lastTally.Paragraphs)
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

			for (var [name, val] of Object.entries(lastTally))
			{
				if (val > maximums[name])
				{
					maximums[name] = val
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

	for (var name of Object.keys(lastTally))
	{
		TableAddHeading(reply, "Num " + name)
	}

	for (var data of dataToDisplay)
	{
		TableNewRow(reply)
		reply.push(data.deets)
		for (var [name, value] of Object.entries(data.tally))
		{
			reply.push("<TD>" + RenderBarFor(value, 200.0 / maximums[name]) + "</TD>")
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

	reply.push(options.join('&nbsp;&nbsp;'))
	reply.push("<P ID=metaDataOutput></P>")
	thenCall.push(MetaDataDrawTable)
}