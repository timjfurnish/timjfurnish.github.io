//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_tabFunctions = {}
var g_selectedTabName = null

const kTabLine = "1px solid #000000"
const kTabSelected = "#F5F5F5"

function TabDefine(tabName, myFunction, displayNameOverride)
{
	g_tabFunctions[tabName] = {func:myFunction, displayName:displayNameOverride ?? CapitaliseFirstLetter(tabName).replace(/_/g, " ")}
}

function SetTabTitle(tabName, text)
{
	var tabby = document.getElementById("tab_" + tabName)
	tabby.innerHTML = BuildTabDisplayText(tabName, text)
}

function BuildTabDisplayText(tabName, extra)
{
	var main = g_tabFunctions[tabName].displayName

	if (extra)
	{
		main = '<FONT COLOR="red">' + main + ' (' + extra + ')</FONT>'
	}
	
	return main
}

function BuildTabs()
{
	var infoPanel = document.getElementById("infoPanel")
	var output = []

	output.push('<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0"><TR>')
	
	var spanCols = 1
	const joiner = '<TD WIDTH="1" STYLE="border-bottom:' + kTabLine + '"></TD>'
	
	for (var tabName of Object.keys(g_tabFunctions))
	{
		if (! g_selectedTabName)
		{
			g_selectedTabName = tabName
		}
		
		spanCols += 2
		output.push(joiner)
		output.push('<TD WIDTH="10" ID="tab_' + tabName + '" TABINDEX=0 ONCLICK="SetTab(\'' + tabName + '\')" CLASS="tabDeselected">' + BuildTabDisplayText(tabName) + "</TD>")
	}
	
	output.push('<TD STYLE="border-bottom:' + kTabLine + '"></TD>')
	output.push('<TR><TD COLSPAN="' + spanCols + '" ID="tabContents" STYLE="padding-right: 20px"></TABLE>')
	infoPanel.innerHTML = output.join('')
	
	SetTab(g_selectedTabName)
}

function ShowContentForSelectedTab()
{
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
		OptionsMakeKey(g_selectedTabName, "page", array[0], array)
		array.forEach(pageName => TabBuildButtonBarAdd(toHere, pageName, "ButtonsBarSet('" + pageName + "')", g_currentOptions[g_selectedTabName].page != pageName))

		if (toHere.length >= 1)
		{
			if (toHere.slice(-1) == '&nbsp;')
			{
				toHere.pop()
			}
		}

		toHere.push("<br><br>")
	}
}