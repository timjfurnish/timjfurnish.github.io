var s_activePuzzleSolutionSoFar = null
var s_completeness = null
var s_clues = null
var s_oldHighlightIdArray = []
var s_playingID = null
var s_startedPlaying = null
var s_autoPaint = null
var s_shareThis = null

const s_cycle = {[' ']:'1', ['1']:'.', ['.']:' '}
const s_cycleReverse = {[' ']:'.', ['.']:'1', ['1']:' '}

const s_congratsButtons = ["WOO", "HOORAY", "GO ME", "YES", "YEAH", "AWESOME", "WOOP WOOP", "FUNKY", "NICE"]


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
	return {name:"Main Menu", shareAs:"Nonography", content:BuildButtons({PLAY:"SetHash('Play')", DESIGN:"SetHash('Design')"}), exitName:"EXIT", exitURL:(location.host ? (location.protocol + "//" + location.host) : "")}
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
		output.push(BuildButtonsForPuzzles("Puzzle", s_puzzles, s_solved))
		output.push('<P><B>Or enter a puzzle code here!</B><BR><INPUT STYLE="max-width: 85vw" ID="puzzleData" TYPE=text SIZE=80 ONCHANGE="EnteredCustom(\'Custom\')"></P>')
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
			return {content:"Failed to find a puzzle with ID '" + param + "'"}
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
		output.push('</P><P><B>Or enter a puzzle code here!</B><BR><INPUT ID="puzzleData" TYPE=text STYLE="max-width: 85vw" SIZE=80 ONCHANGE="EnteredCustom(\'DesignCustom\')"></P>')
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
	
	// Defaults if we don't find what we're looking for...
	var callFunc
	var useName

	// Nullify some things
	s_designing = null
	s_designCanBeSolved = null
	s_activePuzzleSolutionSoFar = null
	s_completeness = null
	s_autoSolveData = null
	s_clues = null
	s_oldHighlightIdArray = []
	s_playingID = null
	s_startedPlaying = null
	s_autoPaint = null
	s_shareThis = null
	document.onmouseup = null

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

	var setup = callFunc?.(param)
	
	if (setup)
	{
		console.log("Displaying page '" + useName + "'" + (param ? " with param '" + param + "'" : ""))
	}
	else
	{
		// If no function (or if function returned something nullish) then show main menu
		setup = BuildMainMenu()
		console.log("Displaying main menu")
	}
	
	if (setup.name)
	{
		useName = setup.name
	}
	
	if (! setup.isEditor)
	{
		s_designerEditMode = "Draw"
	}

	document.title = "Nonography: " + useName

	if (setup.subtitle)
	{
		useName = FormatPuzzleNameAndSize(useName, setup.subtitle)
	}

	const buildHere = []

	buildHere.push('<DIV STYLE="flex-grow: 0.05; text-align: center" id="buttonsGoHere"><H1>NONOGRAPHY</H1><H2 ID="subtitle">' + useName + '</H2>')

	if (setup.content)
	{
		buildHere.push(setup.content)
	}

	buildHere.push('<P><BUTTON onClick="' + (setup.exitURL ?? 'SetHash(\'MainMenu\')') + '">' + (setup.exitName ?? "MAIN MENU") + '</BUTTON>')
	
	if (("shareAs" in setup) && ("share" in navigator))
	{
		s_shareThis =
		{
			title: setup.shareAs,
			text: setup.shareAsDesc ?? "Play Nonogram puzzles in your browser!",
			url: document.location,
		}
		buildHere.push(' <BUTTON onClick="navigator.share(s_shareThis)">' + ("SHARE") + '</BUTTON></P></DIV>')
	}

	buildHere.push('</P></DIV>')

	if (setup.side)
	{
		buildHere.push('<DIV style="flex-grow: 0.05"><CENTER>' + setup.side + '</CENTER></DIV>')
	}
	
	GetElement("outer").innerHTML = buildHere.join('')
	setup.thenCall?.()
}

const kButtonAvailabilityChecks =
{
	["button:SHARE"]: () => s_designCanBeSolved,
	["button:PLAY"]:  () => s_designCanBeSolved,
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

function BuildButtons(info)
{
	const output = []
	
	for (var [label, callThis] of Object.entries(info))
	{
		output.push('<BUTTON id="button:' + label + '" onClick="' + callThis + '">' + label + '</BUTTON>')
	}
	
	return output.join(' ')
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
	s_playingID = playingID
	s_startedPlaying = Date.now()
	
	return {name:title, subtitle:width + " x " + height, shareAs:"Nonography: " + title, content:BuildButtons({SOLVE:"SolveStart(false)", STEP:"SolveStart(true)" /*, HINT:"SmartHint()"*/}), side:output.join(''), exitURL:"SetHash('Play')", exitName:'BACK', thenCall:SetUpPlayMouseHandlers}
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
	
	document.onmouseup = NonoPlayMouseUp
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
			if (s_playingID)
			{
				s_solved[s_playingID] = true
			}
			s_completeness.done = true
			EnableButtons()
			setTimeout(TickPuzzleCompleted, 100)
		}
	}
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
	const timePlaying = Math.floor((Date.now() - s_startedPlaying) / 1000)
	const seconds = timePlaying % 60
	const minutes = (timePlaying - seconds) / 60

	var output = []

	output.push('<h1>Completed!</h1><p id=results>')
	
	if (s_playingID)
	{
		output.push('Puzzle: <b>' + s_puzzles[s_playingID].name + '</b>')
	}
	else
	{
		output.push('Custom Puzzle')
	}
	
	output.push('</p><p id=results>Size: <B>' + s_clues.cols.length + ' x ' + s_clues.rows.length + '</B>')
	output.push('</p><p id=results>Time taken: <B>' + minutes + ':' + String(seconds).padStart(2, '0') + '</B>')
	output.push('</p>')
	output = output.join('')

	elemTop.innerHTML = output + BuildButtons({[s_congratsButtons[Math.floor(Math.random() * s_congratsButtons.length)] + "!"]:"CloseCongrats()"})
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