var g_tweakableSettings =
{
	badWords:"tge tgey",
	skip:["Contents"],
	hyphenCheckPairs:["sat-nav", "set-up", "under-cover", "self-reliance reliant control esteem respect awareness aware", "short-term", "left right-hand", "sand-timer", "back-stage", "stage-left right", "dance-floor", "slow-motion", "some-thing where how what body one", "heart-break breaking breaks breakingly", "car-park parks", "brain-wave waves", "mind lip-reading reader readers read reads"],
	names:[],
	headingIdentifier:"",
	numTextBoxes:1
}

const kSettingNames =
{
	badWords:"Bad words|size=110",
	skip:"Skip lines starting with|cols=60",
	headingIdentifier:"Line is a heading if it includes",
	hyphenCheckPairs:"Hyphen check text|cols=60",
	names:"Character/place names|cols=60"
}

function GetDataType(data)
{
	return Array.isArray(data) ? "array" : typeof(data)
}

function UpdateSettingFromText(name, type, savedSetting, isLoading)
{
	if (type == 'array')
	{
		SettingUpdate(name, savedSetting.split(isLoading ? ',' : '\n'), isLoading)
	}
	else if (type == 'number')
	{
		SettingUpdate(name, parseInt(savedSetting), isLoading)
	}
	else if (type == 'string')
	{
		SettingUpdate(name, savedSetting, isLoading)
	}
	else
	{
		console.log("Don't know how to parse '" + name + "' setting and turn it into type " + type)
	}
}

function SettingsLoad()
{
	for (var [name, val] of Object.entries(g_tweakableSettings))
	{
		var savedSetting = window?.localStorage?.getItem("nova_" + name)
		
		if (savedSetting === null || savedSetting === undefined)
		{
			console.log("No '" + name + "' setting saved, using default " + GetDataType(val) + " '" + val + "'")
		}
		else
		{
			UpdateSettingFromText(name, GetDataType(val), savedSetting, true)
		}
	}
}

function SettingUpdate(name, newValue, isLoading)
{
	if (name in g_tweakableSettings)
	{
		if (g_tweakableSettings[name] !== newValue)
		{
			g_tweakableSettings[name] = newValue

			if (isLoading)
			{
				console.log("Loaded '" + name + "' setting: '" + newValue + "'")
			}
			else
			{
				window.localStorage.setItem("nova_" + name, newValue)
				console.log("Saving '" + name + "' setting: '" + newValue + "'")
			}

			FillInSetting(name)
		}
	}
	else
	{
		window.log("There's no setting called '" + name + "' in settings structure")
	}
}

function SettingsGetNamesArrayArray()
{
	var reply = []
	
	for (var n of g_tweakableSettings.names)
	{
		reply.push(n.split(' '))
	}
	
	return reply
}

function SettingsSayShouldIgnore(txtIn)
{
	for (var t of g_tweakableSettings.skip)
	{
		if (txtIn.startsWith(t))
		{
			console.log("Skipping '" + txtIn + "' because it starts with '" + t + "'")
			return true
		}
	}
	
	return false
}

function FillInSetting(k)
{
	var elem = document.getElementById('setting_' + k)
	
	if (elem)
	{
		const data = g_tweakableSettings[k]
	
		if (Array.isArray(data))
		{
			elem.value = data.join('\n')
			elem.rows = data.length + 1
		}
		else
		{
			elem.value = data
		}
	}
}

function FillInSettings()
{
	Object.keys(kSettingNames).forEach(FillInSetting)
}

function UserChangedSetting(name)
{
	var elem = document.getElementById('setting_' + name)
	const data = g_tweakableSettings[name]
	
	UpdateSettingFromText(name, GetDataType(data), elem.value)
}

g_tabFunctions.settings = function(reply, thenCall)
{
	reply.push("<table>")
	for (var [k, display] of Object.entries(kSettingNames))
	{
		var [displayName, extra] = display.split('|')
		const theType = (Array.isArray(g_tweakableSettings[k])) ? ['textarea', '</textarea>'] : ['input type=text', '</input>']
		reply.push("<tr><td><nobr>" + displayName + '</nobr></td><td><' + theType[0] + ' onChange="UserChangedSetting(\'' + k + '\')" ' + (extra ? extra + ' ' : '') + 'id="setting_' + k + '">' + theType[1])
	}
	reply.push("</table>")
	
	thenCall.push(FillInSettings)
}