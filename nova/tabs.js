//==============================================
// Part of NOVA - NOVel Assistant
// Tim Furnish, 2023-2024
//==============================================

var g_tabFunctions = {}
var g_selectedTabName = null

var kTabLine = "1px solid #000000"
var kTabSelected = style="#F5F5F5"
var kTabDeselected = style="#DDDDDD"

function SetTabTitle(tabName, text)
{
	var tabby = document.getElementById("tab_" + tabName)
	tabby.innerHTML = BuildTabDisplayText(tabName, text)
}

function BuildTabDisplayText(tabName, extra)
{
	var main = tabName.toUpperCase().replace(/_/g, "&nbsp;")
	if (extra)
	{
		main = '<FONT COLOR="red">' + main + ' (' + extra + ')</FONT>'
	}
	
	return '<SMALL><NOBR>&nbsp;' + main + "&nbsp;</NOBR></SMALL>"
}

function BuildTabs()
{
	var infoPanel = document.getElementById("infoPanel")
	var output = []

	output.push("<h3 id=summary></h3>")
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
		output.push('<TD ID="tab_' + tabName + '" TABINDEX=0 ONCLICK="SetTab(\'' + tabName + '\')" STYLE="background-color:' + kTabDeselected + '; cursor:pointer; border-bottom:' + kTabLine + '; border-left:' + kTabLine + '; border-top:' + kTabLine + '; border-right:' + kTabLine + '">' + BuildTabDisplayText(tabName))
	}
	
	output.push('<TD WIDTH=100% STYLE="border-bottom:' + kTabLine + '">&nbsp;')
	output.push('<TR><TD COLSPAN=' + spanCols + ' ID=tabContents STYLE="padding:10px; background-color:' + kTabSelected + '; border-left:' + kTabLine + '; border-bottom:' + kTabLine + '; border-right:' + kTabLine + '"></TABLE>')
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
	CallTheseFunctions(thenCall)
}

function SetTab(name)
{
	if (g_selectedTabName != name)
	{
		var oldTab = document.getElementById("tab_" + g_selectedTabName)
		oldTab.style.borderBottom = kTabLine
		oldTab.style.backgroundColor = kTabDeselected
	}

	g_selectedTabName = name

	var newTab = document.getElementById("tab_" + g_selectedTabName)
	newTab.style.borderBottom = "none"
	newTab.style.backgroundColor = kTabSelected
	
	ShowContentForSelectedTab()
}