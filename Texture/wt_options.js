let s_prefs = new Object()

function MakeOption(name, desc, defOn, formatOn)
{
	let splitFormat = formatOn.split(' ')
	let o = new Object()
	s_prefs[name] = o
	
	o.on = defOn
	o.desc = "<" + formatOn + ">" + desc + "</" + splitFormat[0] + ">"
}

function TabOptions()
{
	let arr = new Array()
	
	for (k of Object.keys(s_prefs))
	{
		let o = s_prefs[k]
		arr.push("<INPUT TYPE=checkbox onchange=\"WTUpdateOption('" + k + "')\" ID=pref_" + k + (o.on ? " checked" : "") + "><label for=pref_" + k + "> " + o.desc + "</label></span>")
	}
	
	return '<small><small><div style="display:inline-block; margin-left: auto; margin-right: auto" align=left><nobr>' + arr.join("<BR>") + '</nobr></div><P><BR>' + WTBuildButton('RESTART', "WTRestart()") + " " + WTBuildButton('SHARE', "WTShare()") + "</P></small></small>"
}

function WTUpdateOption(name)
{
	let elem = document.getElementById('pref_' + name)
	let o = s_prefs[name]
	
	if (elem && o && elem.checked != o.on)
	{
		WTDebug ("Changed option '" + name + "' from " + o.on + " to " + elem.checked)
		o.on = elem.checked
		WTStoreOptions()
	}
}

function WTStoreOptions()
{
	let arr = new Array()
	
	for (k of Object.keys(s_prefs))
	{
		let o = s_prefs[k]
		if (o.on)
		{
			arr.push(k)
		}
	}
	
	WTStorage_WriteValue('options', arr.join(','))
}

function WTInitOptions()
{
	let op = WTStorage_GetValue('options')
	let doDefaults = (op == null)

	MakeOption("u", "Underline interactive items", false, "u")
	MakeOption("b", "Bold items until examined/visited", doDefaults, 'b')
	MakeOption("room", "Use different colour when item is a destination", doDefaults, 'font color="' + s_wtSettings.colourRoom + '"')
	MakeOption("held", "Use different colour for items you're holding", doDefaults, 'font color="' + s_wtSettings.colourHeld + '"')
	MakeOption("combine", "Use different colour when able to combine items", false, 'font color="' + s_wtSettings.colourCombine + '"')

	if (op && ! doDefaults)
	{
		let ar = op.split(',')
		
		for (k of ar)
		{
			let elem = s_prefs[k]
			if (elem)
			{
				elem.on = true
			}
		}
	}	
}

WTAddPanelTab("OPTIONS", TabOptions)