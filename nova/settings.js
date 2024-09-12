//==============================================
// Part of NOVA - NOVel Assistant
// (c) Tim Furnish, 2023-2024
//==============================================

const kHasNoEffect = ["voiceDefault", "voiceSpeech", "speakRate"]
const kCurrentSaveFormatVersion = 2
const kSettingsWhichProvideNames = MakeColourLookUpTable(["names", "names_places", "names_other"], 0.25)

var g_tweakableSettings = {}
var g_openTextAreas = {}
var g_nameLookup
var g_autoTagKeys
var g_tagsExpectedInEverySection = []
	
//=======================================================================
// Automatic tag stuff!
//=======================================================================

// TO DO: would be good to put this into settings, but let's get it working first...
const kAutoTagStuff =
{
	["T minus "]:{tag:"TMINUS", numericalCheck:"descend", includeLineInText:true, characters:",.", clearTags:"", unique:true},
	["Document #"]:{tag:"PART", numericalCheck:"ascend", characters:"", clearTags:"", global:true, unique:true, joinNextLine:true},
	["*"]:{tag:"CHAPTER", numericalCheck:"none", mustInclude:true, clearTags:"TMINUS", global:true, unique:true}
}

const kAutoTagOptions = Object.entries(
{
	mustInclude:
	{
		tooltip:"Verify that the tag text appears in the<BR>document before the tag changes",
		icon:kIconTextAppears,
		onTagSetFunc:(tag, value) => MakeOrAddToObject(window, "g_stillLookingForTagText", tag, value.split(/ *\(/, 1)[0].toLowerCase())
	},
	unique:
	{
		tooltip:"Verify that each instance of<BR>this tag is unique",
		icon:kIconUnicorn,
		onTagSetFunc:function(tag, value)
		{
			if ((tag in g_metaDataSeenValues) && (value in g_metaDataSeenValues[tag]))
			{
				IssueAdd("Found multiple " + FixStringHTML(tag) + " tags set to " + FixStringHTML(value), "UNIQUE")
			}
		}
	},
	includeLineInText:
	{
		tooltip:"Include this text in<BR>the document",
		icon:kIconWrite
	},
	global:
	{
		tooltip:"Verify that this tag is<BR>set throughout",
		icon:kIconGlobal
	},
	joinNextLine:
	{
		tooltip:"Also consume the next line<BR>of the document",
		icon:kIconJoin
	},
})

function CheckOrderOfValues(tag, value, isAscending)
{
	if (tag in g_metaDataSeenValues)
	{
		const valAsNumber = parseInt(value)
		for (var known of Object.keys(g_metaDataSeenValues[tag]))
		{
			const knownAsNumber = parseInt(known)

			if (isAscending ? (valAsNumber <= knownAsNumber) : (valAsNumber >= knownAsNumber))
			{
				IssueAdd("Expected " + valAsNumber + " (from '" + value + "') to be " + (isAscending ? ">" : "<") + " " + knownAsNumber + " (from '" + known + "')", "ORDER")
			}
		}
	}	
}

const kAutoTagChecks =
{
	none:
	{
		icon:""
	},
	descend:
	{
		icon:kIconDescending,
		onTagSetFunc:(tag, value) => CheckOrderOfValues(tag, value, false)
	},
	ascend:
	{
		icon:kIconAscending,
		onTagSetFunc:(tag, value) => CheckOrderOfValues(tag, value, true)
	}
}

AutoTagFixData()

function SettingsAddAutoTag()
{
	const newValue = prompt("Enter string to find in document")
	
	if (newValue && ! (newValue in kAutoTagStuff))
	{
		kAutoTagStuff[newValue] = {tag:"NEWTAG", numericalCheck:"none", characters:"", clearTags:""}
		AutoTagUpdate()
	}
}

function AutoTagOptionToggle(line, k)
{
	if (kAutoTagStuff[line][k])
	{
		delete kAutoTagStuff[line][k]
	}
	else
	{
		kAutoTagStuff[line][k] = true
	}

	AutoTagUpdate()
}

function AutoTagFixData()
{
	g_autoTagKeys = Object.keys(kAutoTagStuff).sort()
	g_tagsExpectedInEverySection = []
	
	for (var {tag, global} of Object.values(kAutoTagStuff))
	{
		if (global && !g_tagsExpectedInEverySection.includes(tag))
		{
			g_tagsExpectedInEverySection.push(tag)
		}
	}

	// If there's anything else we can/should do to optimise analysis, do it here!
}

function AutoTagUpdate()
{
	AutoTagFixData()
	
	const elem = document.getElementById("autoTagCell")
	
	if (elem)
	{
		elem.innerHTML = BuildAutomaticTagsBox()
	}
	
	CallTheseFunctions(ProcessInput)
}

function MakeClickableTextBubble(txt, thePrompt, key)
{
	const extraParam = key ? ", '" + key + "'" : ""
	const displayTxt = key ? kAutoTagStuff[txt][key] : txt
	return '<B class="clickableTextBubble" ONCLICK="AutoTagEditText(\'' + txt + '\', \'' + thePrompt + '\'' + extraParam + ')">' + AddEscapeChars(displayTxt ?? "") + '</B>'
}

function AutoTagEditText(txt, thePrompt, key)
{
	const oldValue = key ? kAutoTagStuff[txt][key] : txt
	const newValue = prompt(thePrompt + ":", oldValue)
	
	if (newValue != null && newValue != oldValue)
	{
		if (newValue == "" && key != 'characters' && key != 'clearTags')
		{
			NovaWarn("User tried to set " + (key ?? "text to find in document") + " to empty string - ignore")
			return
		}
		else if (key)
		{
			kAutoTagStuff[txt][key] = newValue
		}
		else if (newValue in kAutoTagStuff)
		{
			NovaWarn("Can't have two entries which both search for '" + newValue + "' - ignore")
			return
		}
		else
		{
			NovaLog("Changing search text from '" + oldValue + "' to '" + newValue + "'")
			Assert(kAutoTagStuff[oldValue])
			kAutoTagStuff[newValue] = kAutoTagStuff[oldValue]
			Assert(kAutoTagStuff[newValue])
			delete kAutoTagStuff[oldValue]
			Assert(!kAutoTagStuff[oldValue])
			console.log(kAutoTagStuff)
		}
		
		AutoTagUpdate()
	}
}

function AutoTagUpdateOrder()
{
	for (var k of g_autoTagKeys)
	{
		kAutoTagStuff[k].numericalCheck = document.getElementById(MakeElementID("AutoTagOrder", k)).value
	}
	
	CallTheseFunctions(ProcessInput)
}

function BuildAutomaticTagsBox(moreOutput)
{
	var reply = []

	TableOpen(reply)
	TableAddHeading(reply, "Tag")
	TableAddHeading(reply, "Text")
	TableAddHeading(reply, "Remove") // "Process")
	TableAddHeading(reply, "Clear")
	TableAddHeading(reply, "Options")

	for (var line of g_autoTagKeys)
	{
		const {keep, numericalCheck} = kAutoTagStuff[line]
		var numericalCheckBits = ['&nbsp;<select id="' + MakeElementID("AutoTagOrder", line) + '" onchange="AutoTagUpdateOrder()">']
		var optionBits = []

		for (var [key, data] of Object.entries(kAutoTagChecks))
		{
			numericalCheckBits.push('<option value="' + key + '"' + ((numericalCheck == key) ? " selected" : "") + '>' + data.icon + '</option>')
		}

		for (var [k, data] of kAutoTagOptions)
		{
			const isOn = kAutoTagStuff[line][k]
			optionBits.push(MakeIconWithTooltip(data.icon, -4, data.tooltip + (isOn ? ": ON" : ": OFF"), "AutoTagOptionToggle('" + line + "', '" + k + "')", undefined, isOn ? undefined : 0.15, 80))
		}
		optionBits.push(numericalCheckBits.join('') + '</select>')
		
		TableNewRow(reply)
		TableAddCell(reply, PutBitsSideBySide([MakeIconWithTooltip(kIconTrash, 0, "Delete", "delete kAutoTagStuff['" + line + "']; AutoTagUpdate()"), "&nbsp;" + MakeClickableTextBubble(line, "Enter the name for this tag", "tag")]))
		TableAddCell(reply, MakeClickableTextBubble(line, "Enter string to find in document"))
		TableAddCell(reply, MakeClickableTextBubble(line, "Enter characters to remove from line before storing tag text", "characters"))
		TableAddCell(reply, MakeClickableTextBubble(line, "Enter space-seperated list of tags to clear when this text is found", "clearTags"))
		TableAddCell(reply, PutBitsSideBySide(optionBits))
	}

	TableClose(reply)
	
	if (moreOutput)
	{
		moreOutput.customColumnCell = '<td valign="top" align="right" class="cellNoWrap">' + MakeIconWithTooltip(kIconNew, 0, "Add", "SettingsAddAutoTag()")
		moreOutput.cellId = "autoTagCell"
	}
	
	return reply.join("")
}

const kTweakableDefaults =
{
	language:"EN",
	speakRate:1,
	voiceDefault:"",
	voiceSpeech:"",
	badWords:"tg* vice-versa midair half-way part-way partway cliche* *cafes *cafe accomodation naive dance-floor dancefloor stage-show eon* *defense*",
	allowedStartCharacters:'ABCDEFGHIJKLMNOPQRSTUVWXYZ"',
	allowedCharacters:kCharacterElipsis + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ()"\'?.,!',
	startOfSpeech:kCharacterElipsis + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'",
	endOfSpeech:kCharacterElipsis + ".!?\u2014,",
	endOfParagraphSpeech:kCharacterElipsis + ".!?\u2014",
	endOfParagraphNarrative:kCharacterElipsis + ".!?:",
	skip:["Contents"],
	wordsContainingFullStops:['etc.', 'Dr.', 'Mr.', 'Mrs.', 'i.e.', 'e.g.'],
	replace:['\\bO\\.S\\./OFFSCREEN', '([0-9]+)\\.([0-9]+)/$1^$2', '^== (.*) ==$/$1.', "[!\?]'/'", "\bCONT'D\b/CONTINUED", "^EXT\./EXTERIOR", "^INT\./INTERIOR"],
	hyphenCheckPairs:["sat-nav", "set-up", "under-cover", "self-reliance reliant control esteem respect awareness aware", "short-term", "left right-hand", "sand-timer", "back-stage", "stage-left right", "slow-motion", "some-thing where how what body one", "heart-break breaking breaks breakingly broken", "car-park parks", "brain-wave waves", "mind lip-reading reader readers read reads", "twenty thirty forty fifty sixty seventy eighty ninety-one two three four five six seven eight nine", "one two three four five six seven eight nine ten-hundred thousand million billion trillion"],
	names:[],
	names_places:[],
	names_other:[],
	splitInfinitiveIgnoreList:[],
	adverbHyphenIgnoreList:[],
	numberIgnoreList:[],
	suggestNameIfSeenThisManyTimes:5,
	numTextBoxes:1,
	tooltips:true,
	debugListQueuedFunctions:false,
	debugLog:false,
}

const kSettingFunctions =
{
	debugListQueuedFunctions:val => document.getElementById("debugOut").style.display = val ? "block" : "none",
	debugLog:val => document.getElementById("debugLog").style.display = val ? "block" : "none",
	tooltips:val => RedoToTop() + RedoTabTops() + RethinkEnabledTabs()
}

function SortCharactersAndRemoveDupes(inText)
{
	var set = {}
	for (var each of inText)
	{
		set[each] = true
	}
	return Object.keys(set).sort().join('')
}

const SortArray = inArray => inArray.sort()

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
		replace:"Replace^(regex)|mediumTextBox",
		wordsContainingFullStops:"Words with^full stops|shortTextBox",
		skip:"Skip lines^starting with|shortTextBox",
		["Automatic^tags"]:BuildAutomaticTagsBox,
	},
	VOICE:
	{
		language:"Language|language",
		voiceDefault:"Voice (narrative)|voice",
		voiceSpeech:"Voice (speech)|voice",
		speakRate:"Speed",
	},
	NAMES:
	{
		suggestNameIfSeenThisManyTimes:"Capitalised words seen^this many times are^suggested as names",
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
		["Enabled checks"]:moreOutput => BuildIssueDefaults(false, moreOutput),
		["Additional settings"]:moreOutput => BuildIssueDefaults(true, moreOutput),
	},
	DISPLAY:
	{
		tooltips:"Tooltips",
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

OnEvent("clear", true, () =>
{
	g_nameLookup = []

	for (var nameList of SettingsGetNamesArrays())
	{
		const theString = "\\b(?:" + TurnNovaShorthandIntoRegex(nameList.arr.join('|')) + ")\\b"
		g_nameLookup.push({means:nameList.arr[0], type:nameList.type, grandTotal:0, regex:new RegExp(theString, "ig")})
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
	else if (name == 'speakRate')
	{
		SettingUpdate(name, parseFloat(savedSetting), isLoading)
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
		customFunc(g_tweakableSettings[settingName])
	}

	ReadVoices()
	PickVoicesForCurrentLanguage()
}

function SettingSave(name)
{
	var newValue = g_tweakableSettings[name]
	var details = ""
	const dataType = GetDataTypeVerbose(newValue)
	
	if (dataType == "number" || dataType == "string" || dataType == "boolean")
	{
		details = " [" + newValue + "]"
	}
	
	NovaLog("Saving " + dataType + " '" + name + "'" + details)
	
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
			const quoteUnquote = n.split('"')
			var isQuoted = false

			for (var txt of quoteUnquote)
			{
				if (txt)
				{
					for (var name of isQuoted ? [txt.trim()] : OnlyKeepValid(txt.split(' ')))
					{
						inner.push(name)
					}
				}
				isQuoted = !isQuoted
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

function SettingsSayShouldProcess(txtIn)
{
	for (var t of g_tweakableSettings.skip)
	{
		if (txtIn.startsWith(t))
		{
			return false
		}
	}
	
	return true
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
		customFunc(g_tweakableSettings[name])
	}
	else if (name == "language")
	{
		CallTheseFunctions(ReadVoices, PickVoicesForCurrentLanguage, ShowContentForSelectedTab)
	}
	else if (! kHasNoEffect.includes(name))
	{
		CallTheseFunctions(ProcessInput)
	}
}

function PickVoicesForCurrentLanguage()
{
	const fixThese = ['voiceSpeech', 'voiceDefault']
	const usedVoices = {}

	for (var v of fixThese)
	{
		const currentSelection = g_tweakableSettings[v]
		if (currentSelection)
		{
			if (currentSelection in g_voiceLookUp)
			{
				usedVoices[currentSelection] = true
			}
			else
			{
				g_tweakableSettings[v] = ''
			}
		}
	}
	
	const availableVoices = Object.keys(g_voiceLookUp)
	const numAvailable = availableVoices.length

	for (var v of fixThese)
	{
		if (! g_tweakableSettings[v])
		{
			const numUsed = Object.keys(usedVoices).length
			
			var bestScore = 0
			for (var each of availableVoices)
			{
				const myScore = (each.includes("Google") ? 50 : 0) + (usedVoices[each] ? 0 : 100) + each.length
				
				if (myScore > bestScore)
				{
					g_tweakableSettings[v] = each
					bestScore = myScore
				}
			}
			
			if (g_tweakableSettings[v])
			{
//				NovaLog("Need to pick a new " + v + ". Already using " + numUsed + "/" + numAvailable + " " + g_tweakableSettings.language + " voices... selected '" + g_tweakableSettings[v] + "'")
				usedVoices[g_tweakableSettings[v]] = true
				SettingSave(v)
			}
		}
	}
}

function SettingsMakeCustomColumn_Expand(expandId)
{
	return '<td id="expandButton_' + expandId + '" valign="top" align="right" class="cellNoWrap">' + MakeOpenCloseButton(expandId) + '</td>'
}

function SettingsMakeCustomColumn_Add(callThis)
{
	return '<td valign="top" align="right" class="cellNoWrap">ADD</td>'
}

function SettingsAdd(reply, txt, formBits, className, customColumnCell, id)
{
	var args = 'td class="' + className + '"'
	if (id)
	{
		args += ' id="' + id + '"'
	}
	reply.push('<tr><td valign="top" align="right" class="cellNoWrap">' + txt.replaceAll('^', "<BR>") + '</td>')
	reply.push(customColumnCell ?? '<td class="cellNoWrap">')
	reply.push('</td><' + args + '>' + formBits + "</td></tr>")
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
	if (confirm("Do you really want to revert '" + kSettingNames[g_currentOptions.settings.page][whichOne].split('|', 1)[0].replaceAll('^', ' ') + "' to its default value?"))
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

function SettingsIssueToggleAll(doSettings)
{
	var turnThingsOn = false

	for (var warningID of Object.keys(g_warningNames))
	{
		if ((warningID in kOptionCustomNames) == doSettings && !g_currentOptions.settings[warningID])
		{
			turnThingsOn = true
			break
		}
	}

	for (var warningID of Object.keys(g_warningNames))
	{
		if ((warningID in kOptionCustomNames) == doSettings && turnThingsOn == !g_currentOptions.settings[warningID])
		{
			const elem = document.getElementById("settings." + warningID)
			Assert(elem)
			elem.checked = turnThingsOn

			g_currentOptions.settings[warningID] = turnThingsOn
		}
	}

	CallTheseFunctions(ProcessInput)
}

function BuildIssueDefaults(doSettings, moreOutput)
{
	var reply = []

	for (var warningID of Object.keys(g_warningNames))
	{
		if ((warningID in kOptionCustomNames) == doSettings)
		{
			OptionsMakeCheckbox(reply, "ProcessInput()", warningID, doSettings ? kOptionCustomNames[warningID] : ("Check for " + warningID.toLowerCase()), !doSettings, true)
		}
	}
	
	if (moreOutput)
	{
		moreOutput.customColumnCell = '<td valign="top" align="right" class="cellNoWrap">' + MakeIconWithTooltip(kIconCheckbox, 0, "Toggle all", "SettingsIssueToggleAll(" + doSettings + ")")
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
	for (var val of Object.values(kAutoTagStuff))
	{
		val.tidyRegEx = val.removeCharacters ? new RegExp('[' + EscapeRegExSpecialChars(val.removeCharacters) + ']', 'g') : null
	}
	
	Object.keys(g_warningNames).forEach(id => OptionsMakeKey("settings", id, ! (id in kOptionCustomNames)))
	
	IssueAutoFixDefine("ILLEGAL CHARACTERS", "Ignore characters", characters => AddToSetting("allowedCharacters", characters))
	IssueAutoFixDefine("ILLEGAL START CHARACTER", "Ignore characters", characters => AddToSetting("allowedStartCharacters", characters))
	IssueAutoFixDefine("NUMBERS", "Add to allow list", characters => AddToSetting("numberIgnoreList", characters))
	IssueAutoFixDefine("SPLIT INFINITIVE", "Add to allow list", characters => AddToSetting("splitInfinitiveIgnoreList", characters))
	IssueAutoFixDefine("ADVERB WITH HYPHEN", "Add to allow list", characters => AddToSetting("adverbHyphenIgnoreList", characters))
	IssueAutoFixDefine("INVALID FIRST SPEECH CHARACTER", "Ignore characters", characters => AddToSetting("startOfSpeech", characters))
	IssueAutoFixDefine("INVALID FINAL SPEECH CHARACTER", "Ignore characters", characters => AddToSetting("endOfSpeech", characters))
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
			var theEditBits = []
			var customColumnCell = undefined
			
			classList = classList ? classList.split(' ') : []

			if (classList == 'voice')
			{
				theType = 'select'
				for (var voice of Object.keys(g_voiceLookUp).sort())
				{
					theMiddle += "<option>" + voice + "</option>"
				}
				classList = ''
				theEditBits.push(MakeIconWithTooltip(kIconSpeech, 0, "Test", "SpeechTest('" + k + "')"))
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
			else if (k == 'speakRate')
			{
				theType = 'select'
				theMiddle += "<option value=0.78>Super slow</option>"
				theMiddle += "<option value=0.89>Very slow</option>"
				theMiddle += "<option value=1>Slow</option>"
				theMiddle += "<option value=1.11>Normal</option>"
				theMiddle += "<option value=1.22>Fast</option>"
				theMiddle += "<option value=1.33>Very fast</option>"
				theMiddle += "<option value=1.44>Super fast</option>"
				classList = ''
			}
			else if (typeof g_tweakableSettings[k] === "boolean")
			{
				theType = 'input type="checkbox"'
			}
			else
			{
				theEditBits.push(MakeIconWithTooltip(kIconRevert, 0, "Revert", "SettingAskRevert('" + k + "')"))

				if (Array.isArray(g_tweakableSettings[k]))
				{
					theType = 'textarea onFocus="CheckItsOpen(\'' + k + '\')"'
					customColumnCell = SettingsMakeCustomColumn_Expand(k)
					
					if (! (k in g_openTextAreas))
					{
						classList.push('closedTextArea')
					}
					
					if (kTweakableDefaults[k].length)
					{
						theEditBits.push(MakeIconWithTooltip(kIconFix, 0, "Repair", "SettingFixArray('" + k + "')"))
					}
				}
				else if (typeof g_tweakableSettings[k] == "object")
				{
					theEditBits.push("<B>TO DO: SUPPORT THIS OBJECT</B>")
				}
			}

			const tagBits = theType + ' onChange="UserChangedSetting(\'' + k + '\')" ' + (classList.length ? 'class="' + classList.join(' ') + '" ' : '') + 'id="setting_' + k + '"'
			if (theEditBits.length)
			{
				theEditBits.unshift('&nbsp;')
			}
			theEditBits.unshift('<' + tagBits + '>' + theMiddle + '</' + theType.split(' ', 1)[0] + '>')
			SettingsAdd(reply, displayName, PutBitsSideBySide(theEditBits, 'VALIGN=top'), "cellNoWrap", customColumnCell)
		}
		else
		{
			const moreOutput = {}
			const showThisInCell = display(moreOutput)
			SettingsAdd(reply, k, showThisInCell, "cell", moreOutput.customColumnCell, moreOutput.cellId)
		}
	}
	
	TableClose(reply)
	
	thenCall.push(FillInSettings)
}, {icon:kIconSettings})