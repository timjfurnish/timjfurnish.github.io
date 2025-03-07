//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2025
//==============================================

var g_tabFunctions = {}
var g_selectedTabName = null
var g_hoverControls
var g_canSelectTabs = true
var g_tabIconsToDisableWhenNoText = []
var g_cacheTabTitles = {}

function InitTabs()
{
	g_hoverControls = document.getElementById('hoverControls')
}

function SetIfMissing(container, name, value)
{
	if (! (name in container))
	{
		container[name] = value
	}
}

function TabDefine(tabName, myFunction, settings)
{
	const readableName = CapitaliseFirstLetter(tabName).replace(/_/g, " ")
	var storeThis = settings ?? {}
	SetIfMissing(storeThis, "func", myFunction)
	SetIfMissing(storeThis, "tooltipText", readableName)
	SetIfMissing(storeThis, "icon", readableName)
	g_tabFunctions[tabName] = storeThis
}

function SetTabTitle(tabName, text)
{
	if (text)
	{
		g_cacheTabTitles[tabName] = text
		document.getElementById("tabText_" + tabName).innerHTML = g_tabFunctions[tabName].icon + '<span class="alertBubble">&nbsp;' + text + '&nbsp;</span>'
	}
	else
	{
		delete g_cacheTabTitles[tabName]
		document.getElementById("tabText_" + tabName).innerHTML = g_tabFunctions[tabName].icon
	}
}

function MakeIconWithTooltip(icon, angle, tooltipText, clickyFunc, id, alpha, xOffset, fontSize)
{
	//------------------
	// Build extraArgs
	//------------------
	var extraArgs = clickyFunc ? ' onClick="' + clickyFunc + '"' : ''
	var styleBits = []

	if (id)
	{
		extraArgs += ' id="' + id + '"'
	}

	if (fontSize)
	{
		styleBits.push('font-size:' + fontSize)
	}

	if (alpha != undefined)
	{
		styleBits.push('opacity:' + alpha)
	}

	if (styleBits.length)
	{
		extraArgs += ' style="' + styleBits.join('; ') + '"'
	}

	//------------------------------------
	// Build transformBits (for tooltip)
	//------------------------------------
	if (xOffset === undefined)
	{
		xOffset = 50
	}
	var transformBits = ['translate(-' + xOffset + '%, 0px)']
	if (angle)
	{
		transformBits.push('rotate(' + angle + 'deg)')
	}

	//----------------------
	// Put it all together
	//----------------------
	const tooltipHTML = (g_tweakableSettings.tooltips && tooltipText) ? '<br><span class="tooltipBubble" STYLE="transform:' + transformBits.join(' ') + '">' + tooltipText + '</span>' : ""
	return '<center CLASS="iconWithTooltip"><FONT' + extraArgs + '>' + icon + '</FONT>' + tooltipHTML + '</center>'
}

function ShowTabs()
{
	document.getElementById("infoPanel").style.display = "block"
}

function RedoTabTops()
{
	var tilty = -1
	for (var tabName of Object.keys(g_tabFunctions))
	{
		document.getElementById('tab_' + tabName).innerHTML = MakeIconWithTooltip(g_tabFunctions[tabName].icon, Math.round(Math.sin(tilty) * 10), g_tabFunctions[tabName].tooltipText, undefined, "tabText_" + tabName, undefined, undefined, "175%")
		const title = g_cacheTabTitles[tabName]
		if (title)
		{
			SetTabTitle(tabName, title)
		}
		tilty += 3
	}

	g_canSelectTabs = true
}

function BuildTabs()
{
	var infoPanel = document.getElementById("infoPanel")
	var output = []
	output.push('<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0"><TR>')

	var spanCols = 1
	var endCell = '<TD CLASS="tabGap">&nbsp;</TD>'
	var joiner = endCell

	for (var tabName of Object.keys(g_tabFunctions))
	{
		if (! g_selectedTabName)
		{
			g_selectedTabName = tabName
		}
		if (tabName != 'settings' && tabName != 'issues')
		{
			g_tabIconsToDisableWhenNoText.push(tabName)
		}

		spanCols += 2
		output.push(joiner + '<TD WIDTH="10" ID="tab_' + tabName + '" TABINDEX=0 ONCLICK="SetTab(\'' + tabName + '\')" CLASS="tabDeselected"></TD>')
		joiner = '<TD WIDTH="1" CLASS="tabGap"></TD>'
	}

	output.push(endCell)
	output.push('<TR><TD COLSPAN="' + spanCols + '" ALIGN=center ID="tabContents"></TABLE>')
	infoPanel.innerHTML = output.join('')

	document.getElementById("debugLogWrapper").innerHTML = '<div id=screenDims style="padding-bottom:5px"></div><div id=debugLog></div>'
	window.addEventListener("resize", LogWindowDims)
	LogWindowDims()
	ShowTab(g_selectedTabName)
}

function LogWindowDims()
{
	TrySetElementContents("screenDims", "<b>Window:</b> " + window.innerWidth + " x " + window.innerHeight)
}

function ShowHoverControls(arr)
{
	g_hoverControls.innerHTML = arr.join("&nbsp;")
	g_hoverControls.style.display = "block"
}

function ShowContentForSelectedTab()
{
	CancelPendingFunctions()

	g_hoverControls.innerHTML = ""
	g_hoverControls.style.display = "none"
	var displayThis = []
	var thenCall = []

	const page = g_currentOptions[g_selectedTabName]?.page

	if (page === undefined)
	{
		NovaLog("Showing contents for '" + g_selectedTabName + "' tab")
	}
	else
	{
		NovaLog("Showing contents for '" + g_selectedTabName + "' tab, page '" + page + "'")
	}

	const {func, canSelect, alignment, tooltipText} = g_tabFunctions[g_selectedTabName]

	displayThis.push('<CENTER STYLE="color:#888888; font-weight:1000; font-size:150%">' + tooltipText + '<HR></CENTER>')

	func(displayThis, thenCall)

	const elem = document.getElementById('tabContents')
	elem.innerHTML = displayThis.join('\n')
	elem.style.userSelect = canSelect ? "text" : "none"
	elem.style.textAlign = alignment ?? ""
	StopTalking()
	SetOptions()
	CallTheseFunctions(...thenCall)
}

function ShowTab(name)
{
	if (g_selectedTabName != name)
	{
		var oldTab = document.getElementById("tab_" + g_selectedTabName)
		oldTab.className = "tabDeselected"
	}
	g_selectedTabName = name
	var newTab = document.getElementById("tab_" + g_selectedTabName)
	newTab.className = "tabSelected"

	CallTheseFunctions(ShowContentForSelectedTab)
	NovaLogClear("Selected tab '" + name + "'")
}

function SetTab(name)
{
	if (g_canSelectTabs || !g_tabIconsToDisableWhenNoText.includes(name))
	{
		if (g_selectedTabName != name)
		{
			console.log("Changing from '" + g_selectedTabName + "' tab to '" + name + "' tab...")
			ShowTab(name)
		}
	}
}

function TabRedrawGraph()
{
	if (g_selectedTabName == "graph")
	{
		MetaDataDrawGraph()
	}
	else if (g_selectedTabName == "search")
	{
		DrawSmoothedGraph(g_searchDataForGraph)
	}
}

//==============================================
// BUTTONS - for tabs with multiple modes/pages
//==============================================

function TabBuildButtonBarAdd(toHere, displayText, callThis, enable)
{
	const extra = enable ? 'ONCLICK="' + callThis + '"' : 'disabled'
	toHere.push('<BUTTON ' + extra + '>' + displayText + '</BUTTON>')
	toHere.push('')
}

function ButtonsBarSet(pageName)
{
	g_currentOptions[g_selectedTabName].page = pageName
	CallTheseFunctions(ShowContentForSelectedTab)
}

function TabBuildButtonsBar(toHere, array, theDefault)
{
	if (array.length)
	{
		OptionsMakeKey(g_selectedTabName, "page", theDefault ?? array[0], array)
		array.forEach(pageName => TabBuildButtonBarAdd(toHere, pageName, "ButtonsBarSet('" + pageName + "')", g_currentOptions[g_selectedTabName].page != pageName))
		if (toHere.length >= 1)
		{
			if (toHere.slice(-1) == '&nbsp;')
			{
				toHere.pop()
			}
		}
		toHere.push("<br><br>")
		return true
	}

	return false
}

function RethinkEnabledTabs()
{
	const hasNoDataNow = !g_metaDataInOrder?.length
	if (g_canSelectTabs == hasNoDataNow)
	{
		g_canSelectTabs = !hasNoDataNow
		const newOpacity = hasNoDataNow ? 0.25 : 1
		for (var name of g_tabIconsToDisableWhenNoText)
		{
			document.getElementById("tabText_" + name).style.opacity = newOpacity
		}

		if (hasNoDataNow && g_tabIconsToDisableWhenNoText.includes(g_selectedTabName))
		{
			SetTab("settings")
		}
	}
}

OnEvent("processingDone", true, RethinkEnabledTabs)
