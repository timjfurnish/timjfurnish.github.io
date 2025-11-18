var s_activePuzzleSolutionSoFar = null
var s_completeness = null
var s_clues = null
var s_oldHighlightId = null
var s_easyText = ["EASY", "EASYISH", "MEDIUM", "TRICKSY", "HARD", "EVIL"]
var s_playingID = null

const s_cycle = {[' ']:'1', ['1']:'.', ['.']:' '}
const s_cycleReverse = {[' ']:'.', ['.']:'1', ['1']:' '}

const kIconRedCross = "&#x274C;"
const kIconMatch = "&#x2714;&#xFE0F;"

function BuildMainMenu()
{
	const output = []
	output.push('<BUTTON onClick="SetHash(\'Play\')">PLAY</BUTTON> ')
	output.push('<BUTTON onClick="SetHash(\'Design\')">DESIGN</BUTTON>')
	return {name:"Main Menu", content:output.join(''), exitName:"EXIT", exitURL:(location.host ? (location.protocol + "//" + location.host) : "")}
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
		output.push(BuildButtonsForPuzzles("Puzzle"))
		output.push('<P><B>Or enter a puzzle code here!</B><BR><INPUT STYLE="max-width: 100%" ID="puzzleData" TYPE=text SIZE=80 ONCHANGE="EnteredCustom(\'Custom\')"></P>')
		return {content:output.join('')}
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
		output.push(BuildBigButton("#DDDDFF", "SetHash('DesignSize', '15x15')", FormatPuzzleNameAndSize("Empty", 15, 15)))
		output.push('<WBR>')
		output.push(BuildBigButton("#DDDDFF", "SetHash('DesignSize', '20x20')", FormatPuzzleNameAndSize("Empty", 20, 20)))
		output.push('<WBR>')
		output.push(BuildBigButton("#DDDDFF", "SetHash('DesignSize', '25x25')", FormatPuzzleNameAndSize("Empty", 25, 25)))
		output.push('</P><P><B>Or start from one of these!</B><BR>')
		output.push(BuildButtonsForPuzzles("DesignFrom"))
		output.push('</P><P><B>Or enter a puzzle code here!</B><BR><INPUT ID="puzzleData" TYPE=text STYLE="max-width: 100%" SIZE=80 ONCHANGE="EnteredCustom(\'DesignCustom\')"></P>')
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
	var callFunc = BuildMainMenu
	var useName

	// Nullify some things
	s_designing = null
	s_activePuzzleSolutionSoFar = null
	s_completeness = null
	s_autoSolveData = null
	s_clues = null
	s_oldHighlightId = null
	s_playingID = null

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

	console.log("Displaying page '" + useName + "'" + (param ? " with param '" + param + "'" : ""))

	var setup = callFunc(param)
	
	if (! setup)
	{
		// Emergency! Show Main Menu ater all!
		setup = BuildMainMenu()
	}

	GetElement("toHere").innerHTML = '<h2>' + (setup.name ?? useName) + '</h2>' + setup.content + '<P><BUTTON onClick="' + (setup.exitURL ?? 'SetHash(\'MainMenu\')') + '">' + (setup.exitName ?? "MAIN MENU") + '</BUTTON></P>'	
	setup.thenCall?.()
}

function SetBusy(onOff)
{
	for (var eachButton of GetElement("toHere").getElementsByTagName("BUTTON"))
	{
		eachButton.disabled = onOff
	}
}

function Highlight(id, col)
{
	const oldElem = s_oldHighlightId ? GetElement(s_oldHighlightId) : null
	if (oldElem)
	{
		oldElem.bgColor = ""
	}
	
	const newElem = id ? GetElement(id) : null
	if (newElem)
	{
		newElem.bgColor = col
	}
	
	s_oldHighlightId = id
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

function AddCellTickCross(name, extraStyle, bHasClues)
{
	const op = bHasClues ? 0 : 0.2
	const icon = bHasClues ? kIconRedCross : kIconMatch
	return '<TD ID="' + name + '" STYLE="' + extraStyle + 'border:none; opacity: ' + op + '">' + icon + '</TD>'
}

function CalcCellWidthHeight(gridWidth, gridHeight)
{
	gridWidth -= 5
	gridHeight -= 5
	const biggest = Math.min(30, Math.max(gridWidth * 2, gridHeight))
	const reply = Math.floor((90 - biggest) / 3)
	console.log("CalcCellWidthHeight returning " + reply)
	return reply
}

function SetUpPuzzle(title, puzzleIn, playingID)
{
	const output = []
	const height = puzzleIn.length
	const width = puzzleIn[0].length
	const emptyGrid = []
	const buildColumnClues = []
	const buildRowClues = []

	var maxColumnClues = 0

	output.push("<TABLE><TR><TD STYLE=\"border-left: none; border-top: none \"></TD>")
	for (var x = 0; x < width; ++ x)
	{
		const columnClues = CalcClues(GetColumnFromGrid(puzzleIn, x))
		buildColumnClues.push(columnClues)
		output.push('<TD STYLE=\"border-top: none\" CLASS=clues id="col' + x + '" align=center valign=bottom>' + FormatClues(columnClues, '<BR>') + '</TD>')
		maxColumnClues = Math.max(maxColumnClues, columnClues.length)
	}

	const cellWidthHeight = CalcCellWidthHeight(width, height + maxColumnClues)
	const cellWH = 'width="' + cellWidthHeight + '" height="' + cellWidthHeight + '"'

	output.push('<TD STYLE=\"border-top: none; border-right: none; border-bottom: none\"></TD>')
	output.push("</TR>")
	for (var y = 0; y < height; ++ y)
	{
		var buildLine = []
		const rowClues = CalcClues(puzzleIn[y])
		buildRowClues.push(rowClues)
		output.push("<TR align=center><TD STYLE=\"border-left: none; padding-left: 8px; padding-right: 8px\" CLASS=clues id=\"row" + y + "\" align=right>" + FormatClues(rowClues, '&nbsp;') + "</TD>")
		for (var x = 0; x < width; ++ x)
		{
			const coords = x + ',' + y
			output.push('<TD id="gridCell' + x + '.' + y + '" ' + cellWH + ' onClick="ClickGrid(' + coords + ')" onContextMenu="return ClickGrid(' + coords + ', true)" BGCOLOR=#FFEEEE></TD>')
			buildLine.push(" ")
		}
		output.push(AddCellTickCross("rowsTick" + y, "padding-left:3px; ", rowClues.length))
		output.push("</TR>")
		emptyGrid.push(buildLine)
	}
	output.push("<TR><TD STYLE=\"border: none\"></TD>")
	for (var x = 0; x < width; ++ x)
	{
		output.push(AddCellTickCross("colsTick" + x, "", buildColumnClues[x].length))
	}
	output.push('<TD STYLE=\"border: none\"></TD>')
	output.push("</TR>")
	output.push("</TABLE><BR>")
	output.push('<BUTTON onClick="SolveStart(false)">SOLVE</BUTTON> ')
	output.push('<BUTTON onClick="SolveStart(true)">HINT</BUTTON>')

	s_activePuzzleSolutionSoFar = emptyGrid
	s_clues = {cols:buildColumnClues, rows:buildRowClues}
	s_oldHighlightId = null
	s_completeness = {rows:[], cols:[], total:0}
	s_playingID = playingID
	
	return {name:FormatPuzzleNameAndSize(title, width, height), content:output.join(''), exitURL:"SetHash('Play')", exitName:'BACK'}
}

function ClickGrid(x, y, reverse)
{
	if (! s_autoSolveData)
	{
		SetCell(x, y, (reverse ? s_cycleReverse : s_cycle)[s_activePuzzleSolutionSoFar[y][x]])
		if (s_completeness.total == s_clues.rows.length + s_clues.cols.length)
		{
			if (s_playingID)
			{
				s_solved[s_playingID] = true
			}
			alert("Completed! Well done!")
		}
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
	elem.innerHTML = bMatch ? kIconMatch : kIconRedCross
	const bGappy = entireLine.includes(" ")
	elem.style.opacity = bGappy ? (bMatch || myClues.length) ? 0.2 : 0 : 1
	
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

		const elem = GetElement('gridCell' + x + '.' + y)
		
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
					elem.bgColor = '#FFEEEE'
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