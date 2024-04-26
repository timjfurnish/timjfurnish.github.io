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
	allowedCharacters:kCharacterElipsis + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ()"\'?.,!',
	startOfSpeech:kCharacterElipsis + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'",
	endOfSpeech:kCharacterElipsis + ".!?\u2014,",
	endOfParagraphSpeech:kCharacterElipsis + ".!?\u2014",
	endOfParagraphNarrative:kCharacterElipsis + ".!?:",
	skip:["Contents"],
	wordsContainingFullStops:['etc.', 'Dr.', 'Mr.', 'Mrs.', 'i.e.', 'e.g.'],
	replace:['\\bO\\.S\\./OFFSCREEN', '([0-9]+)\\.([0-9]+)/$1^$2', '^== (.*) ==$/$1.'],
	hyphenCheckPairs:["sat-nav", "set-up", "under-cover", "self-reliance reliant control esteem respect awareness aware", "short-term", "left right-hand", "sand-timer", "back-stage", "stage-left right", "dance-floor", "slow-motion", "some-thing where how what body one", "heart-break breaking breaks breakingly broken", "car-park parks", "brain-wave waves", "mind lip-reading reader readers read reads", "twenty thirty forty fifty sixty seventy eighty ninety-one two three four five six seven eight nine", "one two three four five six seven eight nine ten-hundred thousand million billion trillion"],
	names:[],
	names_places:[],
	names_other:[],
	splitInfinitiveIgnoreList:[],
	numberIgnoreList:[],
	headingIdentifier:"",
	removeHeadingIdentifier:false,
	headingMaxCharacters:100,
	numTextBoxes:1,
	debugListQueuedFunctions:false,
	debugLog:false,
}

const kSettingsWhichProvideNames = MakeColourLookUpTable(["names", "names_places", "names_other"])

const kSettingFunctions =
{
	debugListQueuedFunctions:val => document.getElementById("debugOut").style.display = val ? "block" : "none",
	debugLog:val => document.getElementById("debugLog").style.display = val ? "block" : "none",
}

var g_tweakableSettings = {}

function CopyToSetting([key, val])
{
	g_tweakableSettings[key] = Array.isArray(val) ? [...val] : val
}

Object.entries(kTweakableDefaults).forEach(CopyToSetting)

const kSettingNames =
{
	INPUT:
	{
		replace:"Replace (regex)|class=mediumTextBox",
		wordsContainingFullStops:"Valid words containing full stops|class=shortTextBox",
		skip:"Skip lines starting with|class=shortTextBox",
		headingIdentifier:"Line is a heading if it includes|class=shortTextBox",
		removeHeadingIdentifier:"Remove heading identifier",
		headingMaxCharacters:"Max characters in a heading|class=shortTextBox",
	},
	VOICE:
	{
		language:"Language|language",
		voiceDefault:"Voice (narrative)|voice",
		voiceSpeech:"Voice (speech)|voice",
	},
	NAMES:
	{
		names:"Characters|class=mediumTextBox",
		names_places:"Places|class=mediumTextBox",
		names_other:"Other|class=mediumTextBox",
	},
	HYPHENS:
	{
		hyphenCheckPairs:"Hyphen check text|class=longTextBox",
	},
	CHECKS:
	{
		badWords:"Bad words|class=longTextBox",
		allowedCharacters:"Valid characters|class=longTextBox",
		allowedStartCharacters:"Start of paragraph|class=longTextBox",
		startOfSpeech:"Start of speech|class=longTextBox",
		endOfSpeech:"End of speech|class=shortTextBox",
		endOfParagraphSpeech:"End of paragraph speech|class=shortTextBox",
		endOfParagraphNarrative:"End of paragraph narrative|class=shortTextBox",
		splitInfinitiveIgnoreList:"Split infinitive check ignores|class=shortTextBox",
		numberIgnoreList:"Number check ignores|class=shortTextBox",
		["Enabled checks"]:() => BuildIssueDefaults(false),
		["Additional settings"]:() => BuildIssueDefaults(true),
	},
	DEBUG:
	{
		debugListQueuedFunctions:"List queued functions",
		debugLog:"Show log",
	}
}

const kOptionCustomNames =
{
	SCRIPT:"Use script format checking rules",
	["ISSUE SUMMARY"]:"Display issue summary",
}

const kHasNoEffect = ["voiceDefault", "voiceSpeech", "voiceHeading"]

var g_nameLookup, g_permittedNameCapitalisations

OnEvent("clear", true, () =>
{
	g_nameLookup = {}
	g_permittedNameCapitalisations = {}

	for (var nameList of SettingsGetNamesArrays())
	{
		for (var name of nameList.arr)
		{
			const lowerName = name.toLowerCase()

			if (lowerName in g_nameLookup)
			{
				IssueAdd("Name " + FixStringHTML(name) + " features multiple times in name list", "SETTINGS")
			}

			g_nameLookup[lowerName] = nameList.arr[0]
			g_permittedNameCapitalisations[name] = true
			g_permittedNameCapitalisations[CapitaliseFirstLetter(name)] = true
			g_permittedNameCapitalisations[name.toUpperCase()] = true
		}
	}
})

function UpdateSettingFromText(name, type, savedSetting, isLoading)
{
	typeof(savedSetting) == "string" || ShowError("Data '" + name + "' isn't a string")

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
	
	for (var [settingName, customFunc] of Object.entries(kSettingFunctions))
	{
		const param = g_tweakableSettings[settingName]
		console.log("Initialised setting '" + settingName + "' so calling " + DescribeFunction(customFunc) + " with " + GetDataTypeVerbose(param) + " '" + param + "'")
		customFunc(g_tweakableSettings[settingName])
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

function SettingsGetNamesArrays()
{
	var reply = []
	
	for (var key of Object.keys(kSettingsWhichProvideNames))
	{
		for (var n of g_tweakableSettings[key])
		{
			var inner = []
			for (var name of n.split(' '))
			{
				inner.push(name)
			}
			reply.push({arr:inner, type:key})
		}
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
					IssueAdd("Replace rule " + FixStringHTML(ruleText) + " is invalid", "SETTINGS")
				}					
			}
			else
			{
				IssueAdd("Replace rule " + FixStringHTML(ruleText) + " doesn't specify what to turn " + FixStringHTML(bits[0]) + " into", "SETTINGS")
			}
		}
	}

	for (var wordTxt of g_tweakableSettings.wordsContainingFullStops)
	{
		var becomes = wordTxt.replaceAll('.', '^')
		
		if (becomes == wordTxt)
		{
			IssueAdd("String " + FixStringHTML(wordTxt) + " doesn't contain a full stop", "SETTINGS")
		}
		else
		{
			var findThis = wordTxt
			if (! findThis.startsWith('.'))
			{
				findThis = "\\b" + findThis
			}
			if (! findThis.endsWith('.'))
			{
				findThis += "\\b"
			}
			reply.push({regex:new RegExp(findThis.replaceAll('.', '\\.'), 'g'), replaceWith:becomes})
		}
	}

//	console.log(reply)

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
				console.warn("Mismatch! Wanted to set '" + k + "' to " + GetDataTypeVerbose(data) + " '" + data + "' but it's set to " + GetDataTypeVerbose(elem.value) + " '" + elem.value + "'")
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
	
	UpdateSettingFromText(name, GetDataType(g_tweakableSettings[name]), (elem.type == "checkbox") ? elem.checked + "" : elem.value)
	
	const customFunc = kSettingFunctions[name]
	
	if (customFunc)
	{
		const param = g_tweakableSettings[name]
		NovaLog("User changed setting '" + name + "' so calling " + DescribeFunction(customFunc) + " with " + GetDataTypeVerbose(param) + " '" + param + "'")
		customFunc(g_tweakableSettings[name])
	}
	else if (name == "language")
	{
		CallTheseFunctions(ReadVoices, ShowContentForSelectedTab)
	}
	else if (! kHasNoEffect.includes(name))
	{
		CallTheseFunctions(ProcessInput)
	}
}

function SettingsAdd(reply, txt, formBits, className, canExpand)
{
	var expander = ""
	
	if (canExpand)
	{
		expander = kIconOpen
	}
	
	reply.push('<tr><td valign="top" align="right" class="cellNoWrap">' + txt + '</td>')
	reply.push('<td valign="top" align="right" class="cellNoWrap">' + expander + '</td>')
	reply.push('<td class="' + className + '">' + formBits + "</td></tr>")
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
				revert = "&nbsp;" + MakeIconWithTooltip(kIconSpeech, 0, "Test", "SettingTestSpeech('" + k + "')")
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
				revert = "&nbsp;" + MakeIconWithTooltip(kIconRevert, 0, "Revert", "SettingAskRevert('" + k + "')")
				if (Array.isArray(g_tweakableSettings[k]))
				{
					theType = 'textarea'
					if (kTweakableDefaults[k].length)
					{
						revert += MakeIconWithTooltip(kIconFix, 0, "Repair", "SettingFixArray('" + k + "')")
					}
				}
			}
		
			SettingsAdd(reply, displayName, '<nobr><' + theType + ' onChange="UserChangedSetting(\'' + k + '\')" ' + (extra ? extra + ' ' : '') + 'id="setting_' + k + '">' + theMiddle + '</' + theType.split(' ', 1)[0] + '>' + revert + "</nobr>", "cellNoWrap", theType == 'textarea')
		}
		else
		{
			SettingsAdd(reply, k, display(), "cell")
		}
	}
	
	TableClose(reply)
	
	thenCall.push(FillInSettings)
}, kIconSettings)