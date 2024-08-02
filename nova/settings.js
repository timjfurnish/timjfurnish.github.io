//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

// TODO: would be good to put this into settings, but let's get it working first...
const kAutoTagStuff =
{
	["T-minus-"]:{tag:"TMINUS"},
	["Document #"]:{ignoreLine:true, tag:"PART"}
}

const kAutoTagKeys = Object.keys(kAutoTagStuff)

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
	adverbHyphenIgnoreList:[],
	numberIgnoreList:[],
	headingIdentifier:"",
	removeHeadingIdentifier:false,
	headingMaxCharacters:100,
	numTextBoxes:1,
	debugListQueuedFunctions:false,
	debugLog:false,
}

const kSettingFunctions =
{
	debugListQueuedFunctions:val => document.getElementById("debugOut").style.display = val ? "block" : "none",
	debugLog:val => document.getElementById("debugLog").style.display = val ? "block" : "none",
}

const kCurrentSaveFormatVersion = 2
const kSettingsWhichProvideNames = MakeColourLookUpTable(["names", "names_places", "names_other"])

var g_tweakableSettings = {}
var g_openTextAreas = {}

function SortCharactersAndRemoveDupes(inText)
{
	var set = {}
	for (var each of inText)
	{
		set[each] = true
	}
	return Object.keys(set).sort().join('')
}

function SortArray(inArray)
{
	return inArray.sort()
}

const kMaintenanceFunctions =
{
	allowedStartCharacters:SortCharactersAndRemoveDupes,
	allowedCharacters:SortCharactersAndRemoveDupes,
	startOfSpeech:SortCharactersAndRemoveDupes,
	endOfSpeech:SortCharactersAndRemoveDupes,
	endOfParagraphSpeech:SortCharactersAndRemoveDupes,
	endOfParagraphNarrative:SortCharactersAndRemoveDupes,
	
	skip:SortArray,
	wordsContainingFullStops:SortArray,
	hyphenCheckPairs:SortArray,
	names:SortArray,
	names_places:SortArray,
	names_other:SortArray,
	splitInfinitiveIgnoreList:SortArray,
	adverbHyphenIgnoreList:SortArray,
	numberIgnoreList:SortArray,
}

function InitSetting([key, val])
{
	if (Array.isArray(val))
	{
		g_tweakableSettings[key] = OnlyKeepValid([...val])
		SettingPerformMaintenance(key)
//		NovaLog("Initialised setting '" + key + "' to " + g_tweakableSettings[key])
	}
	else if (typeof val == "object")
	{
		Assert(Object.keys(val).length == 0, key + " is an object with keys, InitSetting only supports empty objects");
		g_tweakableSettings[key] = {}
	}
	else
	{
		g_tweakableSettings[key] = val
	}
}

Object.entries(kTweakableDefaults).forEach(InitSetting)

const kSettingNames =
{
	INPUT:
	{
		replace:"Replace (regex)|mediumTextBox",
		wordsContainingFullStops:"Valid words containing full stops|shortTextBox",
		skip:"Skip lines starting with|shortTextBox",
		headingIdentifier:"Line is a heading if it includes|shortTextBox",
		removeHeadingIdentifier:"Remove heading identifier",
		headingMaxCharacters:"Max characters in a heading|shortTextBox",
	},
	VOICE:
	{
		language:"Language|language",
		voiceDefault:"Voice (narrative)|voice",
		voiceSpeech:"Voice (speech)|voice",
	},
	NAMES:
	{
		names:"Characters|mediumTextBox",
		names_places:"Places|mediumTextBox",
		names_other:"Other|mediumTextBox",
	},
	HYPHENS:
	{
		hyphenCheckPairs:"Hyphen check text|longTextBox",
	},
	CHECKS:
	{
		badWords:"Bad words|longTextBox",
		allowedCharacters:"Valid characters|longTextBox",
		allowedStartCharacters:"Start of paragraph|longTextBox",
		startOfSpeech:"Start of speech|longTextBox",
		endOfSpeech:"End of speech|shortTextBox",
		endOfParagraphSpeech:"End of paragraph speech|shortTextBox",
		endOfParagraphNarrative:"End of paragraph narrative|shortTextBox",
		splitInfinitiveIgnoreList:"Split infinitive check ignores|shortTextBox",
		adverbHyphenIgnoreList:"Adverb hyphen check ignores|shortTextBox",
		numberIgnoreList:"Number check ignores|shortTextBox",
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
	["UNSEEN NAMES"]:"Check for unseen names",
}

const kHasNoEffect = ["voiceDefault", "voiceSpeech"]

var g_nameLookup

OnEvent("clear", true, () =>
{
	g_nameLookup = []

	for (var nameList of SettingsGetNamesArrays())
	{
		const theString = "\\b(?:" + TurnNovaShorthandIntoRegex(nameList.arr.join('|')) + ")\\b"
		g_nameLookup.push({means:nameList.arr[0], grandTotal:0, regex:new RegExp(theString, "ig")})
	}
})

function UpdateSettingFromText(name, type, savedSetting, loadingVersion)
{
	typeof(savedSetting) == "string" || ShowError("Data '" + name + "' isn't a string")
	const isLoading = !!loadingVersion

	if (type == 'array')
	{
		const splitCharacter = (loadingVersion == 1) ? ',' : '\n'
		SettingUpdate(name, OnlyKeepValid(savedSetting.split(splitCharacter)).sort(), isLoading)
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
		NovaWarn("Don't know how to parse '" + name + "' setting and turn it into type " + type)
	}
}

function SettingsLoad()
{
	var savedVersion = window?.localStorage?.getItem("nova_saveVersion")
	savedVersion = savedVersion ? parseInt(savedVersion) : 1

	if (savedVersion > kCurrentSaveFormatVersion)
	{
		ShowError("SETTINGS: Couldn't read v" + savedVersion + ".0 settings as script only supports up to v" + kCurrentSaveFormatVersion + ".0")
	}
	else
	{
		if (savedVersion == kCurrentSaveFormatVersion)
		{
			NovaLog("Reading settings (v" + savedVersion + ".0)")
		}
		else
		{
			NovaLog("Reading and resaving settings (from v" + savedVersion + ".0 to v" + kCurrentSaveFormatVersion + ".0)")
			window.localStorage.setItem("nova_saveVersion", kCurrentSaveFormatVersion)
		}

		for (var [name, val] of Object.entries(g_tweakableSettings))
		{
			var savedSetting = window?.localStorage?.getItem("nova_" + name)
			
			if (savedSetting === null || savedSetting === undefined)
			{
	//			console.log("No '" + name + "' setting saved, using default " + GetDataType(val) + " '" + val + "'")
			}
			else
			{
				UpdateSettingFromText(name, GetDataType(val), savedSetting, savedVersion)
				
				if (savedVersion != kCurrentSaveFormatVersion)
				{
					SettingSave(name)
				}
			}
		}
	}
	
	for (var [settingName, customFunc] of Object.entries(kSettingFunctions))
	{
		const param = g_tweakableSettings[settingName]
		NovaLog("Initialised '" + settingName + "' so calling " + DescribeFunction(customFunc) + " with " + GetDataTypeVerbose(param) + " '" + param + "'")
		customFunc(g_tweakableSettings[settingName])
	}

	ReadVoices()
}

function SettingSave(name)
{
	var newValue = g_tweakableSettings[name]
	NovaLog("Saving " + GetDataTypeVerbose(newValue) + " '" + name + "'")
	
	// Some special case fun to save things in the right format...
	if (Array.isArray(newValue))
	{
		newValue = newValue.join('\n')
	}
	
	window.localStorage.setItem("nova_" + name, newValue)
}

function SettingPerformMaintenance(whichOne)
{
	if (whichOne in kMaintenanceFunctions)
	{
//		NovaLog("Calling " + DescribeFunction(kMaintenanceFunctions[whichOne]) + " for " + g_tweakableSettings[whichOne])
		g_tweakableSettings[whichOne] = kMaintenanceFunctions[whichOne](g_tweakableSettings[whichOne])
	}
}

function SettingUpdate(name, newValue, isLoading)
{
	if (name in g_tweakableSettings)
	{
		if (g_tweakableSettings[name] !== newValue)
		{
			g_tweakableSettings[name] = newValue
			SettingPerformMaintenance(name)

			if (! isLoading)
			{
				SettingSave(name)
				FillInSetting(name)
			}
		}
	}
	else
	{
		NovaWarn("There's no setting called '" + name + "' in settings structure")
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
			for (var name of OnlyKeepValid(n.split(' ')))
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
				NovaWarn("Mismatch! Wanted to set '" + k + "' to " + GetDataTypeVerbose(data) + " '" + data + "' but it's set to " + GetDataTypeVerbose(elem.value) + " '" + elem.value + "'")
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
		const reply = customFunc(g_tweakableSettings[name])
		NovaLog("User changed setting '" + name + "' to " + GetDataTypeVerbose(param) + " '" + param + "' - callback returned " + GetDataTypeVerbose(reply) + " '" + reply + "'")
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

function SettingsAdd(reply, txt, formBits, className, expandId)
{	
	reply.push('<tr><td valign="top" align="right" class="cellNoWrap">' + txt + '</td>')
	
	if (expandId)
	{
		reply.push('<td id="expandButton_' + expandId + '" valign="top" align="right" class="cellNoWrap">')
		reply.push(MakeOpenCloseButton(expandId))
	}
	else
	{
		reply.push('<td class="cellNoWrap">')
	}
	
	reply.push('</td><td class="' + className + '">' + formBits + "</td></tr>")
}

function MakeOpenCloseButton(k)
{
	if (k in g_openTextAreas)
	{
		return MakeIconWithTooltip(kIconOpen, 0, "Close", "SettingsOpenClose('" + k + "')")
	}
	
	return MakeIconWithTooltip(kIconClosed, 0, "Open", "SettingsOpenClose('" + k + "')")
}

function CheckItsOpen(whichOne)
{
	if (! (whichOne in g_openTextAreas))
	{
		SettingsOpenClose(whichOne)
	}
}

function SettingsOpenClose(whichOne)
{
	const elem = document.getElementById("expandButton_" + whichOne)
	const textArea = document.getElementById("setting_" + whichOne)

	if (whichOne in g_openTextAreas)
	{
		// It's open, so close it
		textArea.classList.add("closedTextArea")
		delete g_openTextAreas[whichOne]
	}
	else
	{
		// It's closed, so open it
		textArea.classList.remove("closedTextArea")
		g_openTextAreas[whichOne] = true
	}

	elem.innerHTML = MakeOpenCloseButton(whichOne)
}

function SettingAskRevert(whichOne)
{
	if (confirm("Do you really want to revert '" + kSettingNames[g_currentOptions.settings.page][whichOne].split('|', 1)[0] + "' to its default value?"))
	{
		InitSetting([whichOne, kTweakableDefaults[whichOne]])
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

function AddToSetting(whichOne, addThis)
{
	NovaLog("Adding " + addThis + " to " + whichOne + " which is currently " + g_tweakableSettings[whichOne])
	
	if (Array.isArray(g_tweakableSettings[whichOne]))
	{
		g_tweakableSettings[whichOne].push(addThis)
	}
	else
	{
		g_tweakableSettings[whichOne] += addThis
	}
	
	SettingPerformMaintenance(whichOne)
	SettingSave(whichOne)
	CallTheseFunctions(ProcessInput)
}

function InitSettings()
{
	Object.keys(g_warningNames).forEach(id => OptionsMakeKey("settings", id, ! (id in kOptionCustomNames)))
	
	IssueAutoFixDefine("ILLEGAL CHARACTERS", characters => AddToSetting("allowedCharacters", characters))
	IssueAutoFixDefine("ILLEGAL START CHARACTER", characters => AddToSetting("allowedStartCharacters", characters))
	IssueAutoFixDefine("NUMBERS", characters => AddToSetting("numberIgnoreList", characters))
	IssueAutoFixDefine("SPLIT INFINITIVE", characters => AddToSetting("splitInfinitiveIgnoreList", characters))
	IssueAutoFixDefine("ADVERB WITH HYPHEN", characters => AddToSetting("adverbHyphenIgnoreList", characters))
	IssueAutoFixDefine("INVALID FIRST SPEECH CHARACTER", characters => AddToSetting("startOfSpeech", characters))
	IssueAutoFixDefine("INVALID FINAL SPEECH CHARACTER", characters => AddToSetting("endOfSpeech", characters))
}

TabDefine("settings", function(reply, thenCall)
{
	TabBuildButtonsBar(reply, Object.keys(kSettingNames))

	reply.push("<table>")
	for (var [k, display] of Object.entries(kSettingNames[g_currentOptions.settings.page]))
	{
		if (typeof display == "string")
		{
			var [displayName, classList] = display.split('|', 2)
			var theType = 'input type=text'
			var theMiddle = ""
			var revert = ""
			var expandId = undefined
			
			classList = classList ? classList.split(' ') : []

			if (classList == 'voice')
			{
				theType = 'select'
				for (var voice of Object.keys(g_voiceLookUp).sort())
				{
					theMiddle += "<option>" + voice + "</option>"
				}
				classList = ''
				revert = "&nbsp;" + MakeIconWithTooltip(kIconSpeech, 0, "Test", "SettingTestSpeech('" + k + "')")
			}
			else if (classList == 'language')
			{
				theType = 'select'
				for (var voice of g_voiceLanguages)
				{
					theMiddle += "<option>" + voice + "</option>"
				}
				classList = ''
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
					theType = 'textarea onFocus="CheckItsOpen(\'' + k + '\')"'
					expandId = k
					
					if (! (k in g_openTextAreas))
					{
						classList.push('closedTextArea')
					}
					
					if (kTweakableDefaults[k].length)
					{
						revert += MakeIconWithTooltip(kIconFix, 0, "Repair", "SettingFixArray('" + k + "')")
					}
				}
				else if (typeof g_tweakableSettings[k] == "object")
				{
					revert += " <B>OBJECT</B>";
				}
			}
		
			const tagBits = theType + ' onChange="UserChangedSetting(\'' + k + '\')" ' + (classList.length ? 'class="' + classList.join(' ') + '" ' : '') + 'id="setting_' + k + '"'
			SettingsAdd(reply, displayName, '<nobr><' + tagBits + '>' + theMiddle + '</' + theType.split(' ', 1)[0] + '>' + revert + "</nobr>", "cellNoWrap", expandId)
		}
		else
		{
			SettingsAdd(reply, k, display(), "cell")
		}
	}
	
	TableClose(reply)
	
	thenCall.push(FillInSettings)
}, {icon:kIconSettings})