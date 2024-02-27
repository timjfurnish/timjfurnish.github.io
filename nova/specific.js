//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

const kTweakableDefaults =
{
	language:"EN",
	voiceDefault:"",
	voiceSpeech:"",
	voiceHeading:"",
	badWords:"tge tgey",
	allowedStartCharacters:'ABCDEFGHIJKLMNOPQRSTUVWXYZ"',
	allowedCharacters:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ()"\'?.,!',
	skip:["Contents"],
	replace:['\\bDr\\./Dr^', '\\bMr\\./Mr^', '\\bMrs\\./Mrs^', '\\bO\\.S\\./O^S^', '\\bi\\.e\\./i^e^', '\\be\\.g\\./e^g^', '([0-9]+)\\.([0-9]+)/$1^$2', '^(== .* ==)$/$1.'],
	hyphenCheckPairs:["sat-nav", "set-up", "under-cover", "self-reliance reliant control esteem respect awareness aware", "short-term", "left right-hand", "sand-timer", "back-stage", "stage-left right", "dance-floor", "slow-motion", "some-thing where how what body one", "heart-break breaking breaks breakingly broken", "car-park parks", "brain-wave waves", "mind lip-reading reader readers read reads", "twenty thirty forty fifty sixty seventy eighty ninety-one two three four five six seven eight nine", "one two three four five six seven eight nine ten-hundred thousand million billion trillion"],
	names:[],
	headingIdentifier:"",
	headingMaxCharacters:100,
	numTextBoxes:1,
	allowNumbersWithThisManyDigits:4
}

var g_tweakableSettings = {}

function CopyToSetting([key, val])
{
	g_tweakableSettings[key] = Array.isArray(val) ? [...val] : val
//	console.log("Set " + key + " to " + val)
}

Object.entries(kTweakableDefaults).forEach(CopyToSetting)

const kSettingNames =
{
	language:"Language|language",
	voiceDefault:"Voice (narrative)|voice",
	voiceSpeech:"Voice (speech)|voice",
	voiceHeading:"Voice (heading)|voice",
	badWords:"Bad words|size=110",
	replace:"Replace (regex)|cols=60",
	allowedStartCharacters:"Valid characters for start of paragraph|size=110",
	allowedCharacters:"Valid characters|size=110",
	skip:"Skip lines starting with|cols=60",
	headingIdentifier:"Line is a heading if it includes",
	headingMaxCharacters:"Max characters in a heading",
	hyphenCheckPairs:"Hyphen check text|cols=105",
	names:"Character/place names|cols=60",
	allowNumbersWithThisManyDigits:"Allow numbers with this many digits or more"
}

const kOptionCustomNames =
{
	SCRIPT:"Use script format checking rules"
}

const kHasNoEffect = ["voiceDefault", "voiceSpeech", "voiceHeading"]

function UpdateSettingFromText(name, type, savedSetting, isLoading)
{
	if (type == 'array')
	{
		SettingUpdate(name, OnlyKeepValid(savedSetting.split(isLoading ? ',' : '\n')), isLoading)
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

			if (! isLoading)
			{
				window.localStorage.setItem("nova_" + name, newValue)
				FillInSetting(name)
			}
		}
	}
	else
	{
		console.log("There's no setting called '" + name + "' in settings structure")
	}
}

function SettingsGetNamesArrayArray()
{
	var reply = []
	
	for (var n of g_tweakableSettings.names)
	{
		var inner = []
		for (var name of n.split(' '))
		{
			inner.push(name)
		}
		reply.push(inner)
	}
	
	return reply
}

function SettingsSayShouldIgnore(txtIn)
{
	for (var t of g_tweakableSettings.skip)
	{
		if (txtIn.startsWith(t))
		{
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
		CallTheseFunctions(ReadVoices, ShowContentForSelectedTab)
	}
	else if (! kHasNoEffect.includes(name))
	{
		CallTheseFunctions(ProcessInput)
	}
}

function SettingsAdd(reply, txt, formBits)
{
	reply.push("<tr><td width=10 valign=top><nobr>" + txt + "&nbsp;&nbsp;&nbsp;</nobr></td><td>" + formBits + "</td></tr>")
}

function SettingAskRevert(whichOne)
{
	if (confirm("Do you really want to revert '" + kSettingNames[whichOne].split('|', 1)[0] + "' to its default value?"))
	{
		CopyToSetting([whichOne, kTweakableDefaults[whichOne]])
		FillInSetting(whichOne)
		UserChangedSetting(whichOne)
	}
}

function SettingFixArray(whichOne)
{
	var didAnything = false

	for (var a of kTweakableDefaults[whichOne])
	{
		if (! g_tweakableSettings[whichOne].includes(a))
		{
			g_tweakableSettings[whichOne].push(a)
			didAnything = true
		}
	}
	
	if (didAnything)
	{
		FillInSetting(whichOne)
		UserChangedSetting(whichOne)
	}
}

function SettingTestSpeech(whichOne)
{
	console.log("Test speech: " + g_tweakableSettings[whichOne])
	SpeakUsingVoice("Testing, one two three!", whichOne)
}

g_tabFunctions.settings = function(reply, thenCall)
{
	reply.push("<table>")
	for (var [k, display] of Object.entries(kSettingNames))
	{
		var [displayName, extra] = display.split('|')
		var theType = 'input type=text'
		var theMiddle = ""
		var revert = ""

		if (extra == 'voice')
		{
			theType = 'select'
			for (var voice of Object.keys(g_voiceLookUp).sort())
			{
				theMiddle += "<option>" + voice + "</option>"
			}
			extra = ''
			revert = "&nbsp;" + CreateClickableText(kIconSpeech, "SettingTestSpeech('" + k + "')")
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
		else
		{
			revert = "&nbsp;" + CreateClickableText(kIconRevert, "SettingAskRevert('" + k + "')")
			if (Array.isArray(g_tweakableSettings[k]))
			{
				theType = 'textarea'
				if (kTweakableDefaults[k].length)
				{
					revert += CreateClickableText(kIconFix, "SettingFixArray('" + k + "')")
				}
			}
		}
		
		SettingsAdd(reply, displayName, '<' + theType + ' onChange="UserChangedSetting(\'' + k + '\')" ' + (extra ? extra + ' ' : '') + 'id="setting_' + k + '">' + theMiddle + '</' + theType.split(' ')[0] + '>' + revert)
	}
	
	var issueChecks = []
	var issueSettings = []

	for (var warningID of Object.keys(g_warningNames))
	{
		if (warningID in kOptionCustomNames)
		{
			// Options default to false
			OptionsMakeCheckbox(issueSettings, "ProcessInput()", warningID, kOptionCustomNames[warningID])
		}
		else
		{
			// Checks default to true
			OptionsMakeCheckbox(issueChecks, "ProcessInput()", warningID, "Check for " + warningID.toLowerCase(), true)
		}
	}

	SettingsAdd(reply, "Issue checks (default)", OptionsConcat(issueChecks))
	SettingsAdd(reply, "Issue settings (default)", OptionsConcat(issueSettings))
	TableClose(reply)
	
	thenCall.push(FillInSettings)
}