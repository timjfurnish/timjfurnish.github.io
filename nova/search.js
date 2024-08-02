//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_threadSections = []
var g_searchDataForGraph = {colours:{}, data:{}}
var g_threadSectionSelected = 0
var g_threadSectionFragment = 0

const kIndent = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"

function TurnRedIf(input, condition)
{
	return condition ? "<FONT COLOR=Red>" + input + "</FONT>" : input
}

function RedrawSearchResults()
{
	const gapValue = +g_currentOptions.search.smoothing * 4 + 2
	const compress = g_currentOptions.search.compress

	var searchResultsHere = document.getElementById("searchResultsHere")
	var customTextBox = document.getElementById("search.custom")
	var lastHeading = ""
	var countdownUntilNoAdd = gapValue

	if (searchResultsHere && customTextBox)
	{
		var displayThis = "<center><B>No results found</B></center>"
		var graphVisible = false
		var entityNames = document.getElementById("search.entity")?.value
		
		g_searchDataForGraph = {colours:{}, data:[]}

		if (entityNames)
		{
			customTextBox.value = entityNames
			customTextBox.readOnly = true
		}
		else
		{
			entityNames = customTextBox.value
			customTextBox.readOnly = false
		}

		if (entityNames && g_metaDataInOrder.length)
		{
			var output = []
			var grabEmHere = {}
			const theString = "\\b(?:" + TurnNovaShorthandIntoRegex(entityNames) + ")\\b"
			const exp = new RegExp(theString, "ig");

			for (var metadata of g_metaDataInOrder)
			{
				var addAfterSkippedLines = "<H3>" + MetaDataMakeFragmentDescription(metadata.info) + "</H3>"
				var keepShowingCountdown = 0
				var showThisToo = null
				var skippedLines = true

				for (var para of metadata.myParagraphs)
				{
					if (! para.ignoreFragments)
					{
						function GotAMatch(matched)
						{
							const upper = matched.toUpperCase()
							Tally(grabEmHere, upper)
							Tally(grabForPara, upper)
							return Highlighter(matched, undefined, 'highlightFor="' + upper + '"')
						}
						
						var grabForPara = {}
						var s2 = para.allOfIt.replace(exp, GotAMatch)
						const foundTextHere = (para.allOfIt != s2)
						var allowedToAdd = true

						if (foundTextHere)
						{
							countdownUntilNoAdd = gapValue
						}
						else if (countdownUntilNoAdd && compress)
						{
							-- countdownUntilNoAdd
						}
						
						if (countdownUntilNoAdd)
						{
							g_searchDataForGraph.data.push(grabForPara)
						}
						
						if (foundTextHere || keepShowingCountdown)
						{
							var before = ""

							if (foundTextHere)
							{
								keepShowingCountdown = 1
							}
							else
							{
								-- keepShowingCountdown
							}
							
							if (skippedLines)
							{
								before = addAfterSkippedLines
								skippedLines = false
								addAfterSkippedLines = "<br>"
							}

							if (showThisToo)
							{
								output.push(before + kIndent + showThisToo)
								before = ""
							}
							output.push(before + kIndent + TurnRedIf(s2, para.issues))
							showThisToo = null
						}
						else
						{
							if (showThisToo)
							{
								skippedLines = true
							}

							showThisToo = s2
						}						
					}
					else
					{
						keepShowingCountdown = 0
						showThisToo = null
						skippedLines = true
					}
				}
			}

			if (output.length)
			{
				const upperKeys = Object.keys(grabEmHere)
				const colours = MakeColourLookUpTable(upperKeys, 0.3, PickColourOffsetForString(entityNames))

				var realOutput = []
				var recolour = []

				g_searchDataForGraph.colours = colours

				for (var key of upperKeys)
				{
					recolour.push(['highlightFor="' + key + '"', 'style="background-color:' + g_searchDataForGraph.colours[key] + '"'])
				}

				for (var eachLine of output)
				{
					for (var [searchFor, becomes] of recolour)
					{
						eachLine = eachLine.replaceAll(searchFor, becomes)
					}
					realOutput.push(eachLine)
				}

				displayThis = "<center>" + TableShowTally(grabEmHere, g_searchDataForGraph.colours) + "</center>" + realOutput.join('<BR>')
				graphVisible = true
			}
		}
		
		searchResultsHere.innerHTML = displayThis
		
		const graph = document.getElementById("graphCanvas")
		if (graph)
		{
			if (graphVisible)
			{
				graph.style.display = "block"
				SearchDrawGraph()
			}
			else
			{
				graph.style.display = "none"
			}
		}
	}
}

TabDefine("search", function(reply, thenCall)
{
	const specificNames = SettingsGetNamesArrays()
	var nameData = {[""]:"Custom"}

	for (var name of specificNames)
	{
		nameData[name.arr.join('|')] = CapitaliseFirstLetter(name.arr[0])
	}
	
	var options = []
	OptionsMakeSelect(options, "RedrawSearchResults()", "Entity", "entity", nameData, "")
	OptionsMakeTextBox(options, "RedrawSearchResults()", "Search for", "custom")
	OptionsMakeNumberBox(options, "RedrawSearchResults", "Smoothing", "smoothing", 75)
	OptionsMakeCheckbox(options, "RedrawSearchResults()", "compress", "Compress empty areas", false, true)

	reply.push(OptionsConcat(options))
	reply.push("<BR><CANVAS WIDTH=" + CalcGraphCanvasWidth() + " HEIGHT=200 ID=graphCanvas></CANVAS>")
	MakeUpdatingArea(reply, "searchResultsHere", 'align="left" style="user-select:text"')
	
	thenCall.push(RedrawSearchResults)
}, {icon:kIconSearch})

function Smoother(arr)
{
	var total = 0

	const len = arr.length
	const midIndex = (len + 1) / 2
	const div = midIndex * midIndex

	for (var t in arr)
	{
		const frac = (+t + 1) * (len - t) / (div)
		total += arr[t] * frac * frac
	}

	return total
}

function SearchDrawGraph()
{
	// WORK OUT WHAT TO DRAW
	const colourEntries = Object.keys(g_searchDataForGraph.colours)
	const drawData = {}
	const smoothingCount = +g_currentOptions.search.smoothing

	var biggestVal = 0

	for (var spelling of colourEntries)
	{
		drawData[spelling] = {smoothing:[0], drawThis:[]}

		for (var i = 0; i < smoothingCount; ++ i)
		{
			drawData[spelling].smoothing.push(0, 0)
		}
	}
	
	for (var t of g_searchDataForGraph.data)
	{
		var totalHere = 0

		for (var spelling of colourEntries)
		{
			drawData[spelling].smoothing.push(t[spelling] ?? 0)				
			drawData[spelling].smoothing.shift()

			const myVal = Smoother(drawData[spelling].smoothing)
			totalHere += myVal

			drawData[spelling].drawThis.push(totalHere)
		}
		
		if (biggestVal < totalHere)
		{
			biggestVal = totalHere
		}
	}

	for (var i = 0; i < smoothingCount * 2; ++ i)
	{
		var totalHere = 0

		for (var spelling of colourEntries)
		{
			drawData[spelling].smoothing.push(0)
			drawData[spelling].smoothing.shift()

			const myVal = Smoother(drawData[spelling].smoothing)
			totalHere += myVal

			drawData[spelling].drawThis.push(totalHere)
		}
		
		if (biggestVal < totalHere)
		{
			biggestVal = totalHere
		}
	}

	colourEntries.reverse()

	// DONE GATHERING DATA
	
	const canvas = document.getElementById("graphCanvas")
	const drawToHere = canvas?.getContext("2d")
	
	if (drawToHere)
	{
		drawToHere.fillStyle = "#444444"
		drawToHere.fillRect(0, 0, canvas.width, canvas.height)
		
		for (var spelling of colourEntries)
		{
			var numDone = 0
			const scaleX = canvas.width / (drawData[spelling].drawThis.length + 1)
			const scaleY = canvas.height * 0.95 / biggestVal

			drawToHere.fillStyle = g_searchDataForGraph.colours[spelling]
			drawToHere.beginPath()
			drawToHere.moveTo(0, canvas.height)
		
			for (var t of drawData[spelling].drawThis)
			{
				++ numDone
				drawToHere.lineTo(numDone * scaleX, canvas.height - t * scaleY)
			}

			drawToHere.lineTo(canvas.width, canvas.height)
			drawToHere.fill()
		}
	}
}

function HighlightThreadSection(num, bCanScroll)
{
	speechSynthesis.cancel()
	
	if (num >= 0 && num < g_threadSections.length)
	{
		if (g_threadSectionSelected != num)
		{
			TrySetElementClass("threadSection" + g_threadSectionSelected, "highlighter", false)
		}

		g_threadSectionSelected = num
		g_threadSectionFragment = 0
		const theElement = TrySetElementClass("threadSection" + num, "highlighter", true)
		
		if (theElement && bCanScroll)
		{
			const rect = theElement.getBoundingClientRect()
			
			if (rect.bottom > window.innerHeight * 0.8)
			{
				window.scrollTo(0, rect.top + window.scrollY - window.innerHeight * 0.2)
			}
			else if (rect.top < window.innerHeight * 0.2)
			{
				window.scrollTo(0, rect.bottom + window.scrollY - window.innerHeight * 0.8)
			}
		}
	}
	
//	SetTabTitle('voice', g_threadSectionSelected)
	
	return num == g_threadSectionSelected
}

function RedrawThread()
{
	var threadsGoHere = document.getElementById("threadsGoHere")

	var lastHeading = ""
	
	g_threadSections = []
	g_threadSectionSelected = 0

	if (threadsGoHere)
	{
		var output = []
		var mustMatch = g_currentOptions.voice.showThis

		for (var metadata of g_metaDataInOrder)
		{
			var showHeading = "<H3>" + MetaDataMakeFragmentDescription(metadata.info) + "</H3>"
			var before = ""
			
			if (metadata.info[g_currentOptions.voice.page] == mustMatch)
			{
				for (var para of metadata.myParagraphs)
				{
					if (showHeading)
					{
						before = showHeading
						showHeading = false
					}

					output.push(before + kIndent + '<SPAN CLASS="clicky" ONCLICK="HighlightThreadSection(' + g_threadSections.length + ')" ID="threadSection' + g_threadSections.length + '">' + TurnRedIf(para.allOfIt, para.issues) + '</SPAN>')
					g_threadSections.push(para)
					
					before = ""
				}
			}
		}

		threadsGoHere.innerHTML = output.join('<BR>')
	}
	
	HighlightThreadSection(g_threadSectionSelected)
}

function OnDoneThreadSpeakingFragment()
{
	++ g_threadSectionFragment
	ThreadRead()
}

function ThreadRead()
{
	const thingToSay = g_threadSections[g_threadSectionSelected]
	if (thingToSay)
	{
		const fragment = thingToSay.fragments[g_threadSectionFragment]
		if (fragment)
		{
			SpeakUsingVoice(fragment.text + fragment.followedBy, fragment.isSpeech ? "voiceSpeech" : "voiceDefault", OnDoneThreadSpeakingFragment)
		}
		else if (HighlightThreadSection(g_threadSectionSelected + 1, true))
		{
			CallTheseFunctions(ThreadRead)
		}
	}
}

TabDefine("voice", function(reply, thenCall)
{
	const columns = Object.keys(g_metaDataAvailableColumns)
	
	if (columns.length)
	{
		TabBuildButtonsBar(reply, columns)
		
		var nameData = {[""]:""}

		for (var metadata of g_metaDataInOrder)
		{
			if (g_currentOptions.voice.page in metadata.info)
			{
				const txt = metadata.info[g_currentOptions.voice.page]
				nameData[txt] = txt
			}
		}
		
		var options = []
		var hoverOptions = []
		OptionsMakeSelect(options, "RedrawThread()", "Only show text from " + g_currentOptions.voice.page.toLowerCase(), "showThis", nameData, "", true)
//		hoverOptions.push('<button onclick="HighlightThreadSection(g_threadSectionSelected - 1, true)">&lt;</button>')
//		hoverOptions.push('<button onclick="HighlightThreadSection(g_threadSectionSelected + 1, true)">&gt;</button>')
		hoverOptions.push('<BUTTON ONCLICK="ThreadRead()">' + MakeIconWithTooltip(kIconSpeech, -15, "Speak") + '</BUTTON>')
		hoverOptions.push('<BUTTON ONCLICK="speechSynthesis.cancel()">' + MakeIconWithTooltip(kIconMute, -4, "Stop") + '</BUTTON>')
		hoverOptions.push('<BUTTON ONCLICK="window.scrollTo(0,0)">' + MakeIconWithTooltip(kIconToTop, 20, "Scroll to top") + '</BUTTON>')

		reply.push(OptionsConcat(options))
		MakeUpdatingArea(reply, "threadsGoHere", 'align="left" style="user-select:text"')
		
		ShowHoverControls(hoverOptions)
		
		thenCall.push(RedrawThread)
	}
}, {icon:kIconBooks, tooltipText:"Read"})

//---------------------------------------
// Switch to here from another tab
//---------------------------------------

function SwitchToMentionsAndSearchEntity(txt)
{
	const specificNames = SettingsGetNamesArrays()

	for (var name of specificNames)
	{
		if (txt == name.arr[0])
		{
			const searchFor = name.arr.join('|')
			OptionsMakeKey("search", "entity", searchFor, true)
			OptionsMakeKey("search", "custom", searchFor, true)
			ShowTab("search")
			return
		}
		else if (txt.toUpperCase() == name.arr[0].toUpperCase())
		{
			NovaWarn("Suspicious! Text in '" + txt + "' NEARLY matches '" + name.arr[0] + "'")
		}
	}

	ShowError("SwitchToMentionsAndSearchEntity failed to find '" + txt + "'")
}

function SwitchToMentionsAndSearch(txt)
{
	OptionsMakeKey("search", "entity", "", true)
	OptionsMakeKey("search", "custom", txt, true)
	ShowTab("search")
}

function MakeMentionLink(showText, searchForText)
{
	return showText + '&nbsp;' + CreateClickableText(kIconSearch, "SwitchToMentionsAndSearch(" + MakeParamsString(searchForText ?? showText) + ")")
}