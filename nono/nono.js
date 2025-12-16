var s_activePuzzleSolutionSoFar = null
var s_completeness = null
var s_clues = null
var s_oldHighlightIdArray = []
var s_autoPaint = null

const s_cycle = {[' ']:'1', ['1']:'.', ['.']:' '}
const s_cycleReverse = {[' ']:'.', ['.']:'1', ['1']:' '}

const s_congratsButtons = ["WOO!", "HOORAY!", "GO ME!", "YEAH!", "AWESOME!", "WOOP WOOP!", "FUNKY!", "NICE!", "I'M AMAZING!"]
const s_congratsHeaders = ["Completed!", "Well Done!", "Nice Work!", "Good Work!", "Great Work!", "You Did It!", "Fantastic!", "Awesome!"]

const kIconRedCross = "&#x274C;"
const kIconMatch = "&#x2714;&#xFE0F;"

const kCompletenessIcons =
{
	blank:{a:0,   html:kIconRedCross},
	wrong:{a:0.3, html:kIconRedCross},
	right:{a:1,   html:kIconMatch}
}

function GetCompletenessIconInfo(whichOne, rowsOrCols, num)
{
	return kCompletenessIcons[whichOne] ?? {a:0.2, html:'<A HREF="javascript:AutoComplete_' + rowsOrCols + '(' + num + ')">' + kIconMatch + '</A>'}
}

function AutoComplete_rows(y)
{
	const row = s_activePuzzleSolutionSoFar[y]
	var reply = false

	for (var x in row)
	{
		if (row[x] == ' ')
		{
			reply = SetCell(x, y, '.')
		}
	}
	
	return reply
}

function AutoComplete_cols(x)
{
	const col = GetColumnFromGrid(s_activePuzzleSolutionSoFar, x)

	for (var y in col)
	{
		if (col[y] == ' ')
		{
			SetCell(x, y, '.')
		}
	}
}

function BuildMainMenu()
{
	return {name:"Main Menu", shareAs:"Nonography", shareDesc:"Play Nonogram puzzles in your browser!", content:BuildButtons({PLAY:"SetHash('Play')", DESIGN:"SetHash('Design')"}), exitName:"EXIT", exitCalls:"location = location.protocol + '//' + location.host"}
}

function SetHash(newHash, param)
{
	if (param)
	{
		newHash += "=" + param
	}

	location.hash = newHash
}

const s_menusWithNames =
{
	//==============================
	// Play
	//==============================

	["Play"]:param =>
	{
		const output = []
		output.push("<P>" + BuildButtonsForPuzzles("Puzzle", s_puzzles, s_solved, Math.min(Object.keys(s_solved).length + 1, 5)) + "</P>")
//		output.push('<P><B>Or enter a puzzle code here!</B><BR><INPUT STYLE="max-width: 85vw" ID="puzzleData" TYPE=text SIZE=80 ONCHANGE="EnteredCustom(\'Custom\')"></P>')
		return {name:"Choose A Puzzle", content:output.join('')}
	},
	
	["Puzzle"]:param =>
	{
		const data = NonoDecodePuzzle(s_puzzles[param]?.data)

		if (data)
		{
			return SetUpPuzzle(s_puzzles[param].name, data, param)
		}
		else
		{
			return {content:"<p>Failed to find a puzzle with ID '" + param + "'</p>"}
		}
	},
	
	["Custom"]:param =>
	{
		const data = NonoDecodePuzzle(param)

		if (data)
		{
			return SetUpPuzzle("Custom Puzzle", data)
		}
	},

	//==============================
	// Design
	//==============================

	["Design"]:param =>
	{
		const output = []
		output.push('<P><B>Start from an empty grid!</B><BR>')
		output.push(BuildBigButton("#DDDDFF", "SetHash('DesignSize', '15x15')", FormatPuzzleNameAndSize("Empty", "15 x 15")))
		output.push('<WBR>')
		output.push(BuildBigButton("#DDDDFF", "SetHash('DesignSize', '20x20')", FormatPuzzleNameAndSize("Empty", "20 x 20")))
		output.push('<WBR>')
		output.push(BuildBigButton("#DDDDFF", "SetHash('DesignSize', '25x25')", FormatPuzzleNameAndSize("Empty", "25 x 25")))
		
		const solvedPuzzleButtons = BuildButtonsForPuzzles("DesignFrom", s_solved, {})
		if (solvedPuzzleButtons != "")
		{
			output.push('</P><P><B>Or start from a puzzle you\'ve solved!</B><BR>')
			output.push(solvedPuzzleButtons)
		}
		output.push('</P>')
//		output.push('<P><B>Or enter a puzzle code here!</B><BR><INPUT ID="puzzleData" TYPE=text STYLE="max-width: 85vw" SIZE=80 ONCHANGE="EnteredCustom(\'DesignCustom\')"></P>')
		return {content:output.join('')}
	},
	
	["DesignCustom"]:param =>
	{
		const data = NonoDecodePuzzle(param)

		if (data)
		{
			return SetUpDesignerForGrid(data)
		}
	},
	
	["DesignFrom"]:param =>
	{
		return SetUpDesignerFromID(param)
	},
	
	["DesignSize"]:param =>
	{
		const [width, height] = param.split('x')
		return SetUpDesigner(parseInt(width), parseInt(height))
	},
	
	//==============================
	// Tests
	//==============================

	["AutoTest"]:param =>
	{
		return SetUpAutoTest()
	},

}

function NonoSetUp()
{
	window.onhashchange = NonoBuildPage
	NonoBuildPage()
}

function NonoBuildPage()
{
	var [goHere, param] = location.hash?.replace('#', '').split('=', 2)
	var callFunc
	var useName

	// Nullify some things
	s_designing = null
	s_blockPlayAndShare = null
	s_activePuzzleSolutionSoFar = null
	s_completeness = null
	s_autoSolveData = null
	s_clues = null
	s_oldHighlightIdArray = []
	s_autoPaint = null
	onmouseup = null

	// Try and find some overrides for a particular page
	for (var [key, func] of Object.entries(s_menusWithNames))
	{
		if (goHere == key.replaceAll(g_regex, ''))
		{
			callFunc = func
			useName = key
			break
		}
	}

	s_lastSetup = callFunc?.(param)
	
	if (s_lastSetup)
	{
		console.log("Displaying page '" + useName + "'" + (param ? " with param '" + param + "'" : ""))
	}
	else
	{
		// If no function (or if function returned something nullish) then show main menu
		s_lastSetup = BuildMainMenu()
		console.log("Displaying main menu")
	}
	
	if (s_lastSetup.name)
	{
		useName = s_lastSetup.name
	}
	
	if (! s_lastSetup.isEditor)
	{
		s_designerEditMode = "Draw"
	}

	document.title = "Nonography: " + useName

	if (s_lastSetup.subtitle)
	{
		useName = FormatPuzzleNameAndSize(useName, s_lastSetup.subtitle)
	}

	const buildHere = []

	buildHere.push('<DIV STYLE="flex-grow: 0.05; text-align: center" id="buttonsGoHere"><H1>NONOGRAPHY</H1><H2 ID="subtitle">' + useName + '</H2>')

	if (s_lastSetup.content)
	{
		buildHere.push(s_lastSetup.content)
	}

	const backAndMaybeShare = {[s_lastSetup.exitName ?? "MAIN MENU"]:s_lastSetup.exitCalls ?? 'SetHash(\'MainMenu\')'}

	if (("shareAs" in s_lastSetup) && ("share" in navigator))
	{
		backAndMaybeShare.SHARE = "DoShare()"
	}

	buildHere.push('<BR>' + BuildButtons(backAndMaybeShare) + '</DIV>')

	if (s_lastSetup.side)
	{
		buildHere.push('<DIV style="flex-grow: 0.05"><CENTER>' + s_lastSetup.side + '</CENTER></DIV>')
	}
	
	GetElement("outer").innerHTML = buildHere.join('')
	EnableButtons()
	s_lastSetup.thenCall?.()
}

const kButtonAvailabilityChecks =
{
	["button:SHARE"]: () => !s_blockPlayAndShare,
	["button:PLAY"]:  () => !s_blockPlayAndShare,
	["button:SOLVE"]: () => !s_completeness.done,
	["button:STEP"]:  () => !s_completeness.done,
	["button:HINT"]:  () => !s_completeness.done
}

function DisableButtonsIn(here)
{
	for (var eachButton of GetElement(here).getElementsByTagName("BUTTON"))
	{
		eachButton.disabled = true
	}
}

function EnableButtonsIn(here)
{
	for (var eachButton of GetElement(here).getElementsByTagName("BUTTON"))
	{
		const func = kButtonAvailabilityChecks[eachButton.id]
		eachButton.disabled = func ? !func() : false
	}
}

function EnableButtons()
{
	EnableButtonsIn("buttonsGoHere")
}

function BuildButtons(info, useClass)
{
	const output = []
	const extra = useClass ? ' class="' + useClass + '"' : ""
	
	for (var [label, callThis] of Object.entries(info))
	{
		output.push('<BUTTON ' + extra + ' id="button:' + label + '" onClick="' + callThis + '">' + label + '</BUTTON>')
	}
	
	return output.join('')
}

function Highlight(idArray, col)
{
	if (!idArray)
	{
		idArray = []
	}

	for (var oldId of s_oldHighlightIdArray)
	{
		if (! idArray.includes(oldId))
		{
			const oldElem = GetElement(oldId)
			if (oldElem)
			{
				oldElem.bgColor = ""
			}
		}
	}

	for (var newId of idArray)
	{
		const newElem = GetElement(newId)
		if (newElem)
		{
			newElem.bgColor = col
		}
	}
	
	s_oldHighlightIdArray = idArray
}

function EnteredCustom(whichScreen)
{
	const {value} = GetElement("puzzleData")
	const data = NonoDecodePuzzle(value)

	if (data)
	{
		SetHash(whichScreen, value)
	}
}

function SetUpPuzzleFromID(myID)
{
	const data = NonoDecodePuzzle(s_puzzles[myID].data)

	if (data)
	{
		SetUpPuzzle(s_puzzles[myID].name, data, myID)
	}
}

function FormatClues(clues, joiner)
{
	const out = []
	clues.forEach(num => out.push((num >= 10) ? '<small>' + num + '</small>' : num))
	return out.join(joiner)
}

function AddCellTickCross(rowsOrCols, num, extraStyle, numClues)
{
	const name = rowsOrCols + "Tick" + num
	const iconInfo = GetCompletenessIconInfo(numClues ? "blank" : "", rowsOrCols, num)
	return '<TD ID="' + name + '" STYLE="' + extraStyle + '; border:none; opacity: ' + iconInfo.a + '">' + iconInfo.html + '</TD>'
}

function CalcCellWidthHeight(gridWidth, gridHeight)
{
	const baseSize = navigator?.userAgentData?.mobile ? 32 : 37
	return Math.min(2.5, baseSize / Math.max(gridHeight, gridWidth))
}

function RandomFromArray(array)
{
	return array[Math.floor(Math.random() * array.length)]
}

function MakeShareDesc()
{
	const output = []
	const data = s_puzzles[s_lastSetup.currentPuzzleID]
	
	var adjective = "custom"
	
	if (data)
	{
		const {name, tags} = data
		const trickyFraction = (data.complexity - s_lowestDifficulty) / (s_highestDifficulty - s_lowestDifficulty)

		adjective = (trickyFraction > 0.4) ? "tricky" : RandomFromArray(["cool", "awesome", "great", "fantastic", "wonderful", "brilliant", "neat"])

		if (tags.includes("Xmas"))
		{
			output.push("Ho ho ho!")
			adjective += RandomFromArray([" holiday", " Christmas"])
		}
		else if (tags.includes("Halloween"))
		{
			if (Math.random() >= 0.5)
			{
				output.push("Spooky!")
				adjective += " Halloween"
			}
			else
			{
				output.push("Happy Halloween!")
				adjective += " spooky"
			}
		}
	}

	if (s_completeness?.done)
	{
		output.push("I just solved this " + adjective + " Nonogram puzzle in " + s_completeness.done + " - ")
		output.push(RandomFromArray(["can you?", "can you do better?", "beat that!", "now you try!", "can you beat my time?", "your turn!", "try and beat my time!"]))
	}
	else if (Math.random() >= 0.75)
	{
		output.push("I saw this " + adjective + " Nonogram puzzle and thought " + RandomFromArray(["of you!", "you'd like it!"]))
	}
	else if (Math.random() >= 0.25)
	{
		output.push(RandomFromArray(["Try solving this ", "Try to solve this ", "Try this ", "I thought you'd like this ", "I think you'll like this "]) + adjective + " Nonogram puzzle!")
	}
	else
	{
		output.push("Can you solve this " + adjective + " Nonogram puzzle?")
	}
	
	return output.join(' ')
}

function SetUpPuzzle(title, puzzleIn, playingID)
{
	const output = []
	const buttons = []
	const height = puzzleIn.length
	const width = puzzleIn[0].length
	const emptyGrid = []
	const buildColumnClues = []
	const buildRowClues = []

	var maxColumnClues = 0
	var maxRowClues = 0

	output.push('<TABLE HEIGHT=0><TR><TD STYLE="border: none"></TD>')
	for (var x = 0; x < width; ++ x)
	{
		const columnClues = CalcClues(GetColumnFromGrid(puzzleIn, x))
		buildColumnClues.push(columnClues)
		maxColumnClues = Math.max(maxColumnClues, columnClues.length)
	}

	for (var y = 0; y < height; ++ y)
	{
		const rowClues = CalcClues(puzzleIn[y])
		buildRowClues.push(rowClues)
		maxRowClues = Math.max(maxRowClues, rowClues.length)
	}

	const cellWidthHeight = CalcCellWidthHeight(width + maxRowClues + 1, height + maxColumnClues + 1)
	const clueFontSize = 'font-size: ' + (cellWidthHeight * 0.8) + 'vmax'
	const cellWH = 'style="' +clueFontSize + '; width: ' + cellWidthHeight + 'vmax; height: ' + cellWidthHeight + 'vmax"'

	for (var x = 0; x < width; ++ x)
	{
		output.push('<TD STYLE="' + clueFontSize + '; border-top: none" CLASS="topClues" id="cols' + x + '" align=center valign=bottom>' + FormatClues(buildColumnClues[x], '<BR>') + '</TD>')
	}

	output.push('<TD STYLE="border: none"></TD>')
	output.push("</TR>")
	for (var y = 0; y < height; ++ y)
	{
		var buildLine = []
		output.push('<TR align=center><TD STYLE="' + clueFontSize + '; border-left: none; padding-left: 0.75vmax; padding-right: 0.75vmax" CLASS="sideClues" id="rows' + y + '" align="right">' + FormatClues(buildRowClues[y], '&nbsp;') + '</TD>')
		for (var x = 0; x < width; ++ x)
		{
			const coords = x + ',' + y
			output.push('<TD id="gridCell.' + x + '.' + y + '" ' + cellWH + ' onDragStart="return false" onMouseOver="NonoPlayMouseOverGrid(' + coords + ')" onMouseOut="MouseOutGrid(' + coords + ')" onContextMenu="return false"></TD>')
			buildLine.push(" ")
		}
		output.push(AddCellTickCross("rows", y, clueFontSize + "; padding-left:3px", buildRowClues[y].length))
		output.push("</TR>")
		emptyGrid.push(buildLine)
	}
	output.push("<TR><TD STYLE=\"border: none\"></TD>")
	for (var x = 0; x < width; ++ x)
	{
		output.push(AddCellTickCross("cols", x, clueFontSize, buildColumnClues[x].length))
	}
	output.push('<TD STYLE=\"border: none\"></TD>')
	output.push("</TR>")
	output.push("</TABLE>")

	s_activePuzzleSolutionSoFar = emptyGrid
	s_clues = {cols:buildColumnClues, rows:buildRowClues}
	s_completeness = {rows:[], cols:[], total:0}
	
	const subtitle = width + " x " + height
	return {name:title, startTime:Date.now(), subtitle:subtitle, currentPuzzleID:playingID, shareAs:"Nonography: " + title, content:BuildButtons({SOLVE:"SolveStart(false)", STEP:"SolveStart(true)" /*, HINT:"SmartHint()"*/}), side:output.join(''), exitCalls:"SetHash('Play')", exitName:'BACK', thenCall:SetUpPlayMouseHandlers}
}

function SetUpPlayMouseHandlers()
{
	for (var y in s_activePuzzleSolutionSoFar)
	{
		for (var x in s_activePuzzleSolutionSoFar[0])
		{
			const elem = GetElement("gridCell." + x + "." + y)
			elem.gridX = x
			elem.gridY = y
			elem.onmousedown = NonoPlayMouseDown
		}
	}
	
	onmouseup = NonoPlayMouseUp
}

function NonoPlayMouseOverGrid(x, y)
{
	if (! s_autoSolveData)
	{
		Highlight(["cols" + x, "rows" + y], "#FFFFAA")
		
		if (s_autoPaint)
		{
			if (s_autoPaint.to != "1" || s_activePuzzleSolutionSoFar[y][x] == s_autoPaint.from)
			{
				SetCell(x, y, s_autoPaint.to)
			}
		}
	}
}

function MouseOutGrid(x, y)
{
	if (! s_autoSolveData)
	{
		Highlight()
	}
}

function TickPuzzleCompleted()
{
	for (var y in s_activePuzzleSolutionSoFar)
	{
		if (AutoComplete_rows(y))
		{
			setTimeout(TickPuzzleCompleted, 25)
			return
		}
	}
	
	setTimeout(ShowCongrats, 200)
}

function NonoPlayMouseUp()
{
	if (s_autoPaint)
	{
		s_autoPaint = null
		
		if (s_completeness.total == s_clues.rows.length + s_clues.cols.length)
		{
			if (s_lastSetup.currentPuzzleID)
			{
				s_solved[s_lastSetup.currentPuzzleID] = true
			}
			
			const timePlaying = Math.floor((Date.now() - s_lastSetup.startTime) / 1000)
			const seconds = timePlaying % 60
			const minutes = (timePlaying - seconds) / 60

			if (minutes)
			{
				s_completeness.done = minutes + ':' + String(seconds).padStart(2, '0')
			}
			else
			{
				s_completeness.done = seconds + " seconds"
			}
			
			EnableButtons()
			setTimeout(TickPuzzleCompleted, 100)
		}
	}
}

function DoShare()
{
	const customHash = s_lastSetup.shareHash?.()
	const shareThis =
	{
		title: s_lastSetup.shareAs,
		text: s_lastSetup.shareDesc ?? MakeShareDesc(),
		url: customHash ? location.origin + location.pathname + '#' + customHash : location.href,
	}
	console.table(shareThis)
	navigator.share(shareThis)
}

function NonoPlayMouseDown(e)
{
	if (! s_autoSolveData && ! s_autoPaint && ! s_completeness.done)
	{
		const {target, button} = e
		const from = s_activePuzzleSolutionSoFar[target.gridY][target.gridX]
		s_autoPaint = {from:from, to:(button ? s_cycleReverse : s_cycle)[from]}
		SetCell(target.gridX, target.gridY, s_autoPaint.to)
	}
	
	return false
}

function GetElement(id)
{
	const elem = document.getElementById(id)
	
	if (! elem)
	{
		console.warn("No element called '" + name + "'")
	}
	
	return elem
}

function SetCompleteness(setName, index, entireLine)
{
	const myClues = CalcClues(entireLine)
	const bMatch = s_clues[setName][index].join() == myClues.join()
	const elem = GetElement(setName + "Tick" + index)
	
	const bGappy = entireLine.includes(" ")
	const iconInfo = GetCompletenessIconInfo(bMatch ? bGappy ? "" : "right" : myClues.length ? "wrong" : "blank", setName, index)
	
	elem.innerHTML = iconInfo.html
	elem.style.opacity = iconInfo.a
	
	if (bMatch)
	{
		if (s_completeness[setName][index] === undefined)
		{
			++ s_completeness.total
		}

		s_completeness[setName][index] = !bGappy
	}
	else if (index in s_completeness[setName])
	{
		-- s_completeness.total
		delete s_completeness[setName][index]
	}
}

function SetCell(x, y, newContents)
{
	if (newContents === undefined || newContents.length != 1)
	{
		console.warn("newContents='" + newContents + "' for " + x + ", " + y)
	}

	if (s_activePuzzleSolutionSoFar[y][x] != newContents)
	{
		s_activePuzzleSolutionSoFar[y][x] = newContents

		const elem = GetElement('gridCell.' + x + '.' + y)
		
		if (elem)
		{
			if (newContents == '.')
			{
				elem.innerHTML = "&bull;"
				elem.bgColor = '#DDDDDD'
			}
			else
			{
				elem.innerHTML = ""
				if (newContents == '1')
				{
					elem.bgColor = '#222222'
				}
				else
				{
					elem.bgColor = ''
				}
			}
		}
	
		SetCompleteness("rows", y, s_activePuzzleSolutionSoFar[y])
		SetCompleteness("cols", x, GetColumnFromGrid(s_activePuzzleSolutionSoFar, x))

		return true
	}
	
	return false
}

function CalcClues(strIn)
{
	const clues = []
	var lastChar = ' '
	var count = 0
	
	for (var ch of strIn)
	{
		if (ch == ".")
		{
			ch = " "
		}
		
		if (lastChar == ch)
		{
			++ count
		}
		else
		{
			if (lastChar != ' ')
			{
				clues.push(count)
			}
			
			lastChar = ch
			count = 1
		}
	}
	
	if (lastChar != ' ')
	{
		clues.push(count)
	}
	
	return clues
}

function GetColumnFromGrid(grid, columnNum)
{
	var out = []
	for (var row of grid)
	{
		out.push(row[columnNum])
	}
	return out
}

function GetRowFromGrid(grid, rowNum)
{
	return grid[rowNum]
}

function ShowCongrats()
{
	const elemTop = GetElement("popUpTop")
	const elemBack = GetElement("popUpBack")

	var output = []

	const headerText = RandomFromArray(s_congratsHeaders)
	var buttonText
	
	do
	{
		buttonText = RandomFromArray(s_congratsButtons)
	}
	while (buttonText == headerText.toUpperCase())

	output.push('<h1>' + headerText + '</h1><p id=results>')
	
	if (s_lastSetup.currentPuzzleID)
	{
		output.push('Puzzle: <b>' + s_puzzles[s_lastSetup.currentPuzzleID].name + '</b>')
	}
	else
	{
		output.push('Custom Puzzle')
	}
	
	output.push('</p><p id=results>Size: <B>' + s_clues.cols.length + ' x ' + s_clues.rows.length + '</B>')
	output.push('</p><p id=results>Time taken: <B>' + s_completeness.done + '</B>')
	output.push('</p>')
	output = output.join('')

	elemTop.innerHTML = output + "<P>" + BuildButtons({[buttonText]:"CloseCongrats()"}, "biggy") + "<BR>" + BuildButtons({["SHARE PUZZLE"]:"DoShare()", ["CONTINUE"]:"SetHash('Play'); setTimeout(CloseCongrats, 200)"}) + "</P>"
	elemBack.innerHTML = output

	for (var each of [elemTop, elemBack])
	{
		each.style.display = "block"
		each.style.pointerEvents = "auto"
		each.style.transitionDuration = "0.8s"
	}

	setTimeout(() => {
		for (var each of [elemTop, elemBack])
		{
			each.style.opacity = 1
			each.removeEventListener("transitionend", OnTransitionDone)
		}
	}, 0)
}

function CloseCongrats()
{
	for (var each of [GetElement("popUpTop"), GetElement("popUpBack")])
	{
		each.style.transitionDuration = "0.4s"
		each.style.opacity = 0
		each.style.pointerEvents = "none"
		each.addEventListener("transitionend", OnTransitionDone)
	}
}

function OnTransitionDone(event)
{
	if (event.target.nodeName == "DIV")
	{
		event.target.removeEventListener("transitionEnd", OnTransitionDone)
		event.target.style.display="none"
		event.target.innerHTML = ""
	}
}