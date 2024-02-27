//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

var g_tabFunctions = {}
var g_selectedTabName = null

const kTabLine = "1px solid #000000"
const kTabSelected = "#F5F5F5"
const kTabRename = {metadata:"Stats"}

function SetTabTitle(tabName, text)
{
	var tabby = document.getElementById("tab_" + tabName)
	tabby.innerHTML = BuildTabDisplayText(tabName, text)
}

function BuildTabDisplayText(tabName, extra)
{
	var main = (tabName in kTabRename) ? kTabRename[tabName] : CapitaliseFirstLetter(tabName).replace(/_/g, "&nbsp;")

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

	output.push('<TABLE WIDTH=100% BODER=0 CELLPADDING=3 CELLSPACING=0><TR>')
	
	var spanCols = 1
	const joiner = '<TD STYLE="border-bottom:' + kTabLine + '">&nbsp;'
	
	for (var tabName of Object.keys(g_tabFunctions))
	{
		if (! g_selectedTabName)
		{
			g_selectedTabName = tabName
		}
		
		spanCols += 2
		output.push(joiner)
		output.push('<TD ID="tab_' + tabName + '" TABINDEX=0 ONCLICK="SetTab(\'' + tabName + '\')" CLASS="tabDeselected">' + BuildTabDisplayText(tabName))
	}
	
	output.push('<TD WIDTH=100% STYLE="border-bottom:' + kTabLine + '">&nbsp;')
	output.push('<TR><TD COLSPAN=' + spanCols + ' ID="tabContents"></TABLE>')
	infoPanel.innerHTML = output.join('')
	
	SetTab(g_selectedTabName)
}

function ShowContentForSelectedTab()
{
	var displayThis = []
	var thenCall = []
	
	console.log("Showing '" + g_selectedTabName + "' tab...")

	g_tabFunctions[g_selectedTabName](displayThis, thenCall)
		
	document.getElementById('tabContents').innerHTML = displayThis.join('')

	SetOptions()
	CallTheseFunctions(...thenCall)
}

function SetTab(name)
{
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