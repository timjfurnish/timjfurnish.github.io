//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

const kTweakableDefaults =
{
	language:"EN",
	voiceDefault:"",
	voiceSpeech:"",
	badWords:"tge tgey",
	allowedStartCharacters:'ABCDEFGHIJKLMNOPQRSTUVWXYZ"',
	allowedCharacters:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ()"\'?.,!',
	startOfSpeech:kCharacterElipsis + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'",
	endOfSpeech:kCharacterElipsis + ".!?\u2014,",
	endOfParagraphSpeech:kCharacterElipsis + ".!?\u2014",
	endOfParagraphNarrative:kCharacterElipsis + ".!?:",
	skip:["Contents"],
	replace:['\\betc\\./etc^', '\\bDr\\./Dr^', '\\bMr\\./Mr^', '\\bMrs\\./Mrs^', '\\bO\\.S\\./O^S^', '\\bi\\.e\\./i^e^', '\\be\\.g\\./e^g^', '([0-9]+)\\.([0-9]+)/$1^$2', '^== (.*) ==$/$1.'],
	hyphenCheckPairs:["sat-nav", "set-up", "under-cover", "self-reliance reliant control esteem respect awareness aware", "short-term", "left right-hand", "sand-timer", "back-stage", "stage-left right", "dance-floor", "slow-motion", "some-thing where how what body one", "heart-break breaking breaks breakingly broken", "car-park parks", "brain-wave waves", "mind lip-reading reader readers read reads", "twenty thirty forty fifty sixty seventy eighty ninety-one two three four five six seven eight nine", "one two three four five six seven eight nine ten-hundred thousand million billion trillion"],
	names:[],
	splitInfinitiveIgnoreList:[],
	numberIgnoreList:[],
	headingIdentifier:"",
	removeHeadingIdentifier:false,
	headingMaxCharacters:100,
	numTextBoxes:1
}

var g_tweakableSettings = {}

function CopyToSetting([key, val])
{
	g_tweakableSettings[key] = Array.isArray(val) ? [...val] : val
}

Object.entries(kTweakableDefaults).forEach(CopyToSetting)

const kSettingNames =
{
	VOICE:
	{
		language:"Language|language",
		voiceDefault:"Voice (narrative)|voice",
		voiceSpeech:"Voice (speech)|voice",
	},
	["INPUT PROCESSING"]:
	{
		replace:"Replace (regex)|class=longTextBox",
		skip:"Skip lines starting with|class=longTextBox",
		headingIdentifier:"Line is a heading if it includes|class=shortTextBox",
		removeHeadingIdentifier:"Remove heading identifier",
		headingMaxCharacters:"Max characters in a heading|class=shortTextBox",
	},
	NAMES:
	{
		names:"Character/place names|class=longTextBox",
//		hyphenCheckPairs:"Hyphen check text|class=longTextBox",
	},
	["CHECKS"]:
	{
		allowedCharacters:"Valid characters|class=longTextBox",
		allowedStartCharacters:"Start of paragraph|class=longTextBox",
		startOfSpeech:"Start of speech|class=longTextBox",
		endOfSpeech:"End of speech|class=longTextBox",
		endOfParagraphSpeech:"End of paragraph speech|class=longTextBox",
		endOfParagraphNarrative:"End of paragraph narrative|class=longTextBox",
		badWords:"Bad words|class=longTextBox",
		splitInfinitiveIgnoreList:"Split infinitive check ignores|class=longTextBox",
		numberIgnoreList:"Number check ignores|class=longTextBox",
		["Enabled checks"]:() => BuildIssueDefaults(false),
		["Additional settings"]:() => BuildIssueDefaults(true),
	}
}

const kOptionCustomNames =
{
	SCRIPT:"Use script format checking rules",
	["ISSUE SUMMARY"]:"Display issue summary",
}

const kHasNoEffect = ["voiceDefault", "voiceSpeech", "voiceHeading"]

var g_nameLookup, g_permittedNameCapitalisations

OnEvent("clear", () =>
{
	g_nameLookup = {}
	g_permittedNameCapitalisations = {}

	for (var nameList of SettingsGetNamesArrayArray())
	{
		for (var name of nameList)
		{
			g_nameLookup[name.toLowerCase()] = nameList[0]
			g_permittedNameCapitalisations[name] = true
			g_permittedNameCapitalisations[CapitaliseFirstLetter(name)] = true
			g_permittedNameCapitalisations[name.toUpperCase()] = true
		}
	}
})

function UpdateSettingFromText(name, type, savedSetting, isLoading)
{
	GetDataType(savedSetting) == "string" || ShowError("Data '" + name + "' isn't a string")

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
	else if (type == 'boolean')
	{
		SettingUpdate(name, savedSetting == "true", isLoading)
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
//			console.log("No '" + name + "' setting saved, using default " + GetDataType(val) + " '" + val + "'")
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
		console.warn("There's no setting called '" + name + "' in settings structure")
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

function SettingsGetReplacementRegularExpressionsArray()
{
	var reply = []

	for (var ruleText of g_tweakableSettings.replace)
	{
		const bits = ruleText.split('/', 3)
		if (bits[0])
		{
			if (bits.length >= 2)
			{
				try
				{
					reply.push({regex:new RegExp(bits[0], 'g' + (bits[2] ?? '')), replaceWith:bits[1] ?? ''})
				}
				catch
				{
					IssueAdd("Replace rule " + FixStringHTML(ruleText) + " is invalid")
				}					
			}
			else
			{
				IssueAdd("Replace rule " + FixStringHTML(ruleText) + " doesn't specify what to turn " + FixStringHTML(bits[0]) + " into")
			}
		}
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
		else if (typeof data === "boolean")
		{
			elem.checked = data
		}
		else
		{
			elem.value = data
			
			if (data != elem.value)
			{
				console.warn("Mismatch! Wanted to set '" + k + "' to " + GetDataType(data) + " '" + data + "' but it's set to " + GetDataType(elem.value) + " '" + elem.value + "'")
			}
		}
	}
}

function FillInSettings()
{
	Object.keys(kSettingNames[g_currentOptions.settings.page]).forEach(FillInSetting)
}

function UserChangedSetting(name)
{
	var elem = document.getElementById('setting_' + name)
	const data = g_tweakableSettings[name]
	
	UpdateSettingFromText(name, GetDataType(data), (elem.type == "checkbox") ? elem.checked + "" : elem.value)
	
	if (name == "language")
	{
		CallTheseFunctions(ReadVoices, ShowContentForSelectedTab)
	}
	else if (! kHasNoEffect.includes(name))
	{
		CallTheseFunctions(ProcessInput)
	}
}

function SettingsAdd(reply, txt, formBits, className)
{
	reply.push('<tr><td width="10" valign="top" class="cellNoWrap">' + txt + '&nbsp;&nbsp;&nbsp;</td><td class="' + className + '">' + formBits + "</td></tr>")
}

function SettingAskRevert(whichOne)
{
	if (confirm("Do you really want to revert '" + kSettingNames[g_currentOptions.settings.page][whichOne].split('|', 1)[0] + "' to its default value?"))
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
	SpeakUsingVoice("Testing, one two three!", whichOne)
}

function BuildIssueDefaults(doSettings)
{
	var reply = []

	for (var warningID of Object.keys(g_warningNames))
	{
		if ((warningID in kOptionCustomNames) == doSettings)
		{
			OptionsMakeCheckbox(reply, "ProcessInput()", warningID, doSettings ? kOptionCustomNames[warningID] : ("Check for " + warningID.toLowerCase()), !doSettings, true)
		}
	}

	return OptionsConcat(reply)
}

function InitSettings()
{
	Object.keys(g_warningNames).forEach(id => OptionsMakeKey("settings", id, ! (id in kOptionCustomNames)))
}

TabDefine("settings", function(reply, thenCall)
{
	TabBuildButtonsBar(reply, Object.keys(kSettingNames))

	reply.push("<table>")
	for (var [k, display] of Object.entries(kSettingNames[g_currentOptions.settings.page]))
	{
		if (typeof display == "string")
		{
			var [displayName, extra] = display.split('|', 2)
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
			else if (typeof g_tweakableSettings[k] === "boolean")
			{
				theType = 'input type="checkbox"'
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
		
			SettingsAdd(reply, displayName, '<' + theType + ' onChange="UserChangedSetting(\'' + k + '\')" ' + (extra ? extra + ' ' : '') + 'id="setting_' + k + '">' + theMiddle + '</' + theType.split(' ', 1)[0] + '>' + revert, "cellNoWrap")
		}
		else
		{
			SettingsAdd(reply, k, display(), "cell")
		}
	}
	
	TableClose(reply)
	
	thenCall.push(FillInSettings)
})