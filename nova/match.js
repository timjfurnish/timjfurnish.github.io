//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

OnEvent("clear", true, () =>
{
})

function MatchCompare()
{
	const reply = []

	if (g_currentOptions.match.chunks != '')
	{
		const compareRaw = document.getElementById('compareWithThis').value.replace(/\</g, '[').replace(/\>/g, ']').replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'").split(/[\n]+/)
		const replaceRules = SettingsGetReplacementRegularExpressionsArray()
		
		var currentChunkName = "none"
		var logSkippedLines = false

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
					if (logSkippedLines)
					{
						TableAddCell(reply, "OK")
					}
					
					TableNewRow(reply)
					TableAddCell(reply, thisChunkName)

					function GetLineToSkip()
					{
						var txtInProcessed = compareRaw.shift()
						for (var {regex, replaceWith} of replaceRules)
						{
							txtInProcessed = txtInProcessed.replace(regex, replaceWith)
						}
						return txtInProcessed
					}
					
					var skipLine = GetLineToSkip()
					while (thisChunkName != skipLine)
					{
						if (compareRaw.length == 0)
						{
							break
						}
						skipLine = GetLineToSkip()
					}
					
					logSkippedLines = true

					if (skipLine == thisChunkName)
					{
						currentChunkName = thisChunkName
					}
					else
					{
						TableAddCell(reply, '<FONT COLOR=purple>Failed to find start of ' + g_currentOptions.match.chunks + ' "' + thisChunkName + '"</FONT>')
						logSkippedLines = false
						break
					}
				}
				
				if (logSkippedLines)
				{
					for (var line of myParagraphs)
					{
						var shouldMatch = compareRaw.shift()
						if (line.allOfIt != shouldMatch)
						{
							TableAddCell(reply, '<FONT COLOR=red>' + line.allOfIt + '</FONT><BR><FONT COLOR=orange>' + shouldMatch + '</FONT>', true)
							logSkippedLines = false
							break
						}
					}
				}
			}
		}
		
		if (logSkippedLines)
		{
			TableAddCell(reply, "OK")
		}
	}

	UpdateArea('matchOutput', reply.join(''))
}

TabDefine("match", function(reply, thenCall)
{
	var options = []
	var chunkOptions = {[""]:""}
	Object.keys(g_metaDataAvailableColumns).forEach(name => chunkOptions[name] = name)
	OptionsMakeSelect(options, "MatchCompare()", "Chunk using", "chunks", chunkOptions, "", true)
	reply.push(OptionsConcat(options) + "<BR>")
	reply.push('<textarea class="docIn" id="compareWithThis" onChange="MatchCompare()"></textarea>')
	MakeUpdatingArea(reply, "matchOutput", 'style="user-select:text"')
	thenCall.push(MatchCompare)
}, {icon:kIconMatch, tooltipText:"Does it match?"})