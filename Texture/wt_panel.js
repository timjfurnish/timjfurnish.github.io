let s_panelTabs = new Object()
let s_selectedTab = null

function WTAddPanelTab(name, func)
{
	s_panelTabs[name] = func
}

function WTSelectTab(name)
{
	s_selectedTab = name
}

function WTRedrawTab()
{
	let tabsElem = document.getElementById("PANELTABS")
	if (tabsElem)
	{
		let tabBar = new Array()

		for (tabName of Object.keys(s_panelTabs))
		{
			let fmtName = tabName.replace(/ /g, '&nbsp;')

			if (tabName == s_selectedTab)
			{
				tabBar.push('&nbsp;<B style="' + s_wtSettings.panelTabStyleOn + '">' + fmtName + "</B>&nbsp;")
			}
			else
			{
				tabBar.push('&nbsp;<B><A HREF="javascript:WTSelectAndDrawTab(\'' + tabName + '\')" style="color: ' + s_wtSettings.panelTabCol + '; text-decoration:none">' + fmtName + '</A></B>&nbsp;')
			}
		}

		tabsElem.innerHTML = "<hr>" + tabBar.join(" ") + "<hr>"
	}
	
	let contentElem = document.getElementById("OPTIONSCONTENTS")
	if (contentElem)
	{
		let func = s_panelTabs[s_selectedTab]
		let content = func ? func() : "Unknown tab '" + s_selectedTab + "'"
		contentElem.innerHTML = content
	}
}

function WTSelectAndDrawTab(name)
{
	WTSelectTab(name)
	WTRedrawTab()
}

function WTShowPanel(p)
{
	let optionsElem = document.getElementById("OPTIONSROW")
	let theStyle = optionsElem.style
	
	if (theStyle.display == "none")
	{
		if (p)
		{
			WTSelectTab(p)
		}

		WTRedrawTab()
		theStyle.display = ""
		document.getElementById("GAMEROW").style.display = "none"
	}
	else
	{
		theStyle.display = "none"
		document.getElementById("GAMEROW").style.display = ""

    	WTShowText(WTPrepareText(s_lastTextPrepared))
	}
}