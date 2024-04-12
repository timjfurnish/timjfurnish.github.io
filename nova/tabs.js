//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_tabFunctions = {}
var g_selectedTabName = null
var g_hoverControls
var g_canSelectTabs = true
var g_tabIconsToDisableWhenNoText = []

const kTabLine = "1px solid #000000"
const kTabSelected = "#F5F5F5"

function InitTabs()
{
	g_hoverControls = document.getElementById('hoverControls')
}

function TabDefine(tabName, myFunction, displayNameOverride, tooltip)
{
	const readableName = CapitaliseFirstLetter(tabName).replace(/_/g, " ")
	g_tabFunctions[tabName] = {func:myFunction, tooltipText:tooltip ?? readableName, displayName:displayNameOverride ?? readableName}
}

function SetTabTitle(tabName, text)
{
	console.log("Setting extra text for tab " + tabName + " to " + text)
	var tabby = document.getElementById("tabText_" + tabName)
	tabby.innerHTML = BuildTabDisplayText(tabName, text)
}

function BuildTabDisplayText(tabName, extra)
{
	var main = '&nbsp;' + g_tabFunctions[tabName].displayName + '&nbsp;'

	if (extra != undefined)
	{
		main += ('<span class="alertBubble">&nbsp;' + extra + '&nbsp;</span>')
	}
	
	return main
}

function BuildTabs()
{
	var infoPanel = document.getElementById("infoPanel")
	var output = []

	output.push('<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0"><TR>')
	
	var spanCols = 1
	var endCell = '<TD STYLE="border-bottom:' + kTabLine + '">&nbsp;&nbsp;&nbsp;&nbsp;</TD>'
	var joiner = endCell
	var tilty = -1
	
	for (var tabName of Object.keys(g_tabFunctions))
	{
		if (! g_selectedTabName)
		{
			g_selectedTabName = tabName
		}

		if (tabName != 'settings')
		{
			g_tabIconsToDisableWhenNoText.push(tabName)
		}
		
		spanCols += 2
		output.push(joiner)
		output.push('<TD WIDTH="10" ID="tab_' + tabName + '" TABINDEX=0 ONCLICK="SetTab(\'' + tabName + '\')" CLASS="tabDeselected">')
		output.push('<DIV CLASS="iconWithTooltip">')
		output.push('<span id="tabText_' + tabName + '">' + BuildTabDisplayText(tabName) + '</span>')
		output.push('<span class="tooltipBubble" STYLE="transform:rotate(' + Math.round(Math.sin(tilty) * 10) + 'deg)">' + g_tabFunctions[tabName].tooltipText + '</span>')
		output.push("</DIV>")
		output.push("</TD>")
		joiner = '<TD WIDTH="1" STYLE="border-bottom:' + kTabLine + '"></TD>'
		tilty += 3
	}
	
	output.push(endCell)
	output.push('<TR><TD COLSPAN="' + spanCols + '" ALIGN=center ID="tabContents"></TABLE>')
	infoPanel.innerHTML = output.join('')
	
	SetTab(g_selectedTabName)
}

function ShowHoverControls(arr)
{
	g_hoverControls.innerHTML = arr.join("&nbsp;")
	g_hoverControls.style.display = "block"
}

function ShowContentForSelectedTab()
{
	g_hoverControls.innerHTML = ""
	g_hoverControls.style.display = "none"

	var displayThis = []
	var thenCall = []
	
//	console.log("Showing '" + g_selectedTabName + "' tab...")

	g_tabFunctions[g_selectedTabName].func(displayThis, thenCall)
		
	document.getElementById('tabContents').innerHTML = displayThis.join('')
	
	speechSynthesis.cancel()

	SetOptions()
	CallTheseFunctions(...thenCall)
}

function SetTab(name)
{
	if (g_canSelectTabs || !g_tabIconsToDisableWhenNoText.includes(name))
	{
		console.log("Selecting '" + name + "' tab...")

		if (g_selectedTabName != name)
		{
			var oldTab = document.getElementById("tab_" + g_selectedTabName)
			oldTab.className = "tabDeselected"
		}

		g_selectedTabName = name

		var newTab = document.getElementById("tab_" + g_selectedTabName)
		newTab.className = "tabSelected"
		
		ShowContentForSelectedTab()
	}
}

//==============================================
// BUTTONS - for tabs with multiple modes/pages
//==============================================

function TabBuildButtonBarAdd(toHere, displayText, callThis, enable)
{
	const extra = enable ? 'ONCLICK="' + callThis + '"' : 'disabled'
	toHere.push('<BUTTON ' + extra + '>' + displayText + '</BUTTON>')
	toHere.push('&nbsp;')
}

function ButtonsBarSet(pageName)
{
	g_currentOptions[g_selectedTabName].page = pageName
	CallTheseFunctions(ShowContentForSelectedTab)
}

function TabBuildButtonsBar(toHere, array)
{
	if (array.length)
	{
//		toHere.push("<center>")
		OptionsMakeKey(g_selectedTabName, "page", array[0], array)
		array.forEach(pageName => TabBuildButtonBarAdd(toHere, pageName, "ButtonsBarSet('" + pageName + "')", g_currentOptions[g_selectedTabName].page != pageName))

		if (toHere.length >= 1)
		{
			if (toHere.slice(-1) == '&nbsp;')
			{
				toHere.pop()
			}
		}

//		toHere.push("</center><br>")
		toHere.push("<br><br>")
	}
}

function RethinkEnabledTabs()
{
	const hasAnyDataNow = g_metaDataInOrder.length > 0
	console.log("Data=" + g_metaDataInOrder.length + " so hasAnyDataNow=" + hasAnyDataNow)

	if (g_canSelectTabs != hasAnyDataNow)
	{
		g_canSelectTabs = hasAnyDataNow
		const newOpacity = hasAnyDataNow ? 1 : 0.25

		for (var name of g_tabIconsToDisableWhenNoText)
		{
			document.getElementById("tabText_" + name).style.opacity = newOpacity
			
			console.log((hasAnyDataNow ? "   Enabling " : "   Disabling ") + name)
		}
		
		if (! hasAnyDataNow)
		{
			SetTab("settings")
		}
	}
}

OnEvent("processingDone", true, RethinkEnabledTabs)
