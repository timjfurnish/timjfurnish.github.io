var g_tweakableSettings =
{
	language:"",
	voiceDefault:"",
	voiceSpeech:"",
	voiceHeading:"",
	badWords:"tge tgey",
	skip:["Contents"],
	hyphenCheckPairs:["sat-nav", "set-up", "under-cover", "self-reliance reliant control esteem respect awareness aware", "short-term", "left right-hand", "sand-timer", "back-stage", "stage-left right", "dance-floor", "slow-motion", "some-thing where how what body one", "heart-break breaking breaks breakingly broken", "car-park parks", "brain-wave waves", "mind lip-reading reader readers read reads", "twenty thirty forty fifty sixty seventy eighty ninety-one two three four five six seven eight nine", "one two three four five six seven eight nine ten-hundred thousand million billion"],
	names:[],
	headingIdentifier:"",
	headingMaxCharacters:100,
	numTextBoxes:1,
	allowNumbersWithThisManyDigits:4
}

const kSettingNames =
{
	language:"Language|language",
	voiceDefault:"Voice (default)|voice",
	voiceSpeech:"Voice (speech)|voice",
	voiceHeading:"Voice (heading)|voice",
	badWords:"Bad words|size=110",
	skip:"Skip lines starting with|cols=60",
	headingIdentifier:"Line is a heading if it includes",
	headingMaxCharacters:"Max characters in a heading",
	hyphenCheckPairs:"Hyphen check text|cols=105",
	names:"Character/place names|cols=60",
	allowNumbersWithThisManyDigits:"Allow numbers with this many digits or more",
}

const kHasNoEffect = ["voiceDefault", "voiceSpeech", "voiceHeading"]

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
		console.warn("Don't know how to parse '" + name + "' setting and turn it into type " + type)
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
	
	ReadVoices()
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
				FillInSetting(name)
			}
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
			
			if (data != elem.value)
			{
				console.warn("Mismatch! Wanted to set '" + k + "' to '" + data + "' but it's set to '" + elem.value + "'")
			}
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
	
	if (name == "language")
	{
		ReadVoices()
		ShowContentForSelectedTab()
	}
	else if (! kHasNoEffect.includes(name))
	{
		ProcessInput()
	}
}

g_tabFunctions.settings = function(reply, thenCall)
{
	reply.push("<table>")
	for (var [k, display] of Object.entries(kSettingNames))
	{
		var [displayName, extra] = display.split('|')
		var theType = (Array.isArray(g_tweakableSettings[k])) ? 'textarea': 'input type=text'
		var theMiddle = ""

		if (extra == 'voice')
		{
			theType = 'select'
			for (var voice of Object.keys(g_voiceLookUp).sort())
			{
				theMiddle += "<option>" + voice + "</option>"
			}
			extra = ''
		}
		else if (extra == 'language')
		{
			theType = 'select'
			for (var voice of g_voiceLanguages)
			{
				theMiddle += "<option>" + voice + "</option>"
			}
			extra = ''
		}
		
		const theCloseTag = "</" + theType.split(' ')[0] + ">"
		reply.push('<tr><td width=10><nobr>' + displayName + '&nbsp;&nbsp;&nbsp;</nobr></td><td>')
		reply.push('<' + theType + ' onChange="UserChangedSetting(\'' + k + '\')" ' + (extra ? extra + ' ' : '') + 'id="setting_' + k + '">')
		reply.push(theMiddle + '</' + theType.split(' ')[0] + '>')
	}
	reply.push("<tr><td colspan=2><H3>Check for issues:</H3>")
	
	var options = []

	for (var warningID of Object.keys(g_warningNames))
	{
		OptionsMakeCheckbox(options, "MetaDataDrawTable()", warningID)
	}

	reply.push(OptionsConcat(options))
	reply.push("</table>")
	
	thenCall.push(FillInSettings)
}