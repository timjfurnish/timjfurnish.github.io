var g_metaDataCurrent = {}
var g_metaDataInOrder = []
var g_metaDataParagraphsWithoutChanges = 0
var g_metaDataSentencesWithoutChanges = 0

function MetaDataSet(strIn)
{
	MetaDataEndProcess()

	var [key, val] = strIn.split(':')
	key = key.toUpperCase()

	// TODO: custom callback
	if (key == 'LOC' && key in g_metaDataCurrent)
	{
		const newBits = val.split('|')
		const oldBits = g_metaDataCurrent[key].split('|')
		if (oldBits[0] != newBits[0] && oldBits != 'sparks' && newBits != 'sparks' && oldBits != 'movie' && newBits != 'movie')
		{
			IssueAdd("Moving straight from " + oldBits + " to " + newBits)
		}
	}
	
	g_metaDataCurrent[key] = val
}

function MetaDataEndProcess()
{
	if (g_metaDataSentencesWithoutChanges)
	{
		var info = []
		for (var [key, val] of Object.entries(g_metaDataCurrent))
		{
			info.push(key + '=' + val)
		}
		g_metaDataInOrder.push("<TR><TD>" + info.join('; ') + "<TD>" + g_metaDataParagraphsWithoutChanges + "<TD>" + g_metaDataSentencesWithoutChanges)
	
		g_metaDataParagraphsWithoutChanges = 0
		g_metaDataSentencesWithoutChanges = 0
	}
}

function MetaDataReset()
{
	g_metaDataCurrent = {}
	g_metaDataInOrder = []

	g_metaDataParagraphsWithoutChanges = 0
	g_metaDataSentencesWithoutChanges = 0
}

function MetaDataProcessParagraph(numSentences)
{
	g_metaDataSentencesWithoutChanges += numSentences
	++ g_metaDataParagraphsWithoutChanges
}

g_tabFunctions.metadata = function(reply, thenCall)
{
	reply.push("<TABLE>" + g_metaDataInOrder.join('') + "</TABLE>")
}