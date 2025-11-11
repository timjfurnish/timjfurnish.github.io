var s_activePuzzleSolutionSoFar = null
var s_completeness = null
var s_clues = null
var s_oldHighlightId = null
var s_easyText = ["EASY", "EASYISH", "MEDIUM", "TRICKSY", "HARD", "EVIL"]

const s_cycle = {[' ']:'1', ['1']:'.', ['.']:' '}
const s_cycleReverse = {[' ']:'.', ['.']:'1', ['1']:' '}
const s_cellWidthHeight = 25

const kIconRedCross = "&#x274C;"
const kIconMatch = "&#x2714;&#xFE0F;"

function Deploy(title, contents, backFunc, backName)
{
	GetElement("toHere").innerHTML = '<h2>' + title + '</h2>' + contents + '<P><BUTTON onClick="' + (backFunc ?? 'NonoSetUp()') + '">' + (backName ?? "MAIN MENU") + '</BUTTON></P>'
	
	s_activePuzzleSolutionSoFar = null
	s_completeness = null
	s_autoSolveData = null
	s_clues = null
	s_oldHighlightId = null
}

function NonoSetUp()
{
	const output = []
	output.push('<BUTTON onClick="SetUpPrePlay()">PLAY</BUTTON>')
	output.push('<BUTTON onClick="SetUpPreDesigner()">DESIGN</BUTTON>')
	const exitURL = (location.host ? (location.protocol + "//" + location.host) : "")
	Deploy("Welcome", output.join(' '), "navigation.navigate('" + exitURL + "/')", "EXIT")

	s_designing = null
}

function SetUpPrePlay()
{
	const buttonHTML = BuildButtonsForPuzzles("SetUpPuzzleFromID")
	Deploy("Pick A Puzzle", buttonHTML + '<P><B>Or enter a puzzle code here!</B><BR><INPUT ID="puzzleData" TYPE=text SIZE=80 ONCHANGE="SetUpPuzzleFromTextBox()"></P>')
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

function SetUpPuzzleFromTextBox()
{
	const {value} = GetElement("puzzleData")
	const data = NonoDecodePuzzle(value)

	if (data)
	{
		SetUpPuzzle("Custom Puzzle", data)
	}
	else
	{
		alert("Invalid puzzle definition! Sorry!")
	}
}

function SetUpPuzzleFromID(myID)
{
	const data = NonoDecodePuzzle(s_puzzles[myID].data)

	if (data)
	{
		SetUpPuzzle(s_puzzles[myID].name, data)
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

function SetUpPuzzle(title, puzzleIn)
{
	const output = []
	const height = puzzleIn.length
	const width = puzzleIn[0].length
	const cellWH = 'width="' + s_cellWidthHeight + '" height="' + s_cellWidthHeight + '"'
	const emptyGrid = []
	const buildColumnClues = []
	const buildRowClues = []

	output.push("<TABLE><TR><TD STYLE=\"border-left: none; border-top: none \"></TD>")
	for (var x = 0; x < width; ++ x)
	{
		const columnClues = CalcClues(GetColumnFromGrid(puzzleIn, x))
		buildColumnClues.push(columnClues)
		output.push('<TD STYLE=\"border-top: none\" CLASS=clues id="col' + x + '" align=center valign=bottom width="' + s_cellWidthHeight + '">' + FormatClues(columnClues, '<BR>') + '</TD>')
	}
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
	Deploy(FormatPuzzleNameAndSize(title, width, height), output.join(''), "SetUpPrePlay()", 'BACK')

	s_activePuzzleSolutionSoFar = emptyGrid
	s_clues = {cols:buildColumnClues, rows:buildRowClues}
	s_oldHighlightId = null
	s_completeness = {rows:[], cols:[], total:0}
}

function ClickGrid(x, y, reverse)
{
	if (! s_autoSolveData)
	{
		SetCell(x, y, (reverse ? s_cycleReverse : s_cycle)[s_activePuzzleSolutionSoFar[y][x]])
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