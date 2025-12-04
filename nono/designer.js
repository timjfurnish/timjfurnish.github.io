var s_designing = null
var s_designCanBeSolved = null

const s_cycleDesigner = {[' ']:'1', ['1']:' '}

const kIconAdd = "&#x2795;" // "&#x1F195;"
const kIconTrash = "&#x1F5D1;&#xFE0F;"

const kDesignModes =
{
	["Draw"]:(x,y) =>
	{
		s_autoPaint = s_cycleDesigner[s_designing[y][x]]
		NonoDesignMouseOverGrid(x, y)
	},
	["Duplicate Row"]:(x,y) =>
	{
		if (s_designing.length < kMaxHeight)
		{
			s_designing.splice(y, 0, [...s_designing[y]])
			RedoDesigner()
		}
	},
	["Remove Row"]:(x,y) =>
	{
		if (s_designing.length > kMinHeight)
		{
			s_designing.splice(y, 1)
			RedoDesigner()
		}
	},
	["Duplicate Column"]:(x,y) =>
	{
		if (s_designing[0].length < kMaxWidth)
		{
			s_designing.forEach(row => row.splice(x, 0, row[x]))
			RedoDesigner()
		}
	},
	["Remove Column"]:(x,y) =>
	{
		if (s_designing[0].length > kMinWidth)
		{
			s_designing.forEach(row => row.splice(x, 1))
			RedoDesigner()
		}
	},
}

const kDesignerButtons = {SHARE:"DesignerSave()", TRIM:"DesignerTrim()", INVERT:"DesignerInv()", CLEAR:"DesignerClear()", PLAY:"DesignToPlay()"}

function SetUpDesignerFromID(myID)
{
	const data = NonoDecodePuzzle(s_puzzles[myID].data)

	if (data)
	{
		return SetUpDesignerForGrid(data)
	}
}

function CreateEmptyGridOfSize(width, height)
{
	const emptyGrid = []

	for (var y = 0; y < height; ++ y)
	{
		var buildLine = []
		for (var x = 0; x < width; ++ x)
		{
			buildLine.push(" ")
		}
		emptyGrid.push(buildLine)
	}
	
	return emptyGrid
}

function SetUpDesigner(width, height)
{	
	return SetUpDesignerForGrid(CreateEmptyGridOfSize(width, height))
}

function SetUpDesignerForGrid(grid)
{
	if (! Array.isArray(grid))
	{
		console.warn("Expected an array")
		return
	}

	s_designing = grid
	return RebuildDesignScreen()
}

function RebuildDesignScreen()
{	
	const output = []
	const controls = []
	const cellWidthHeight = CalcCellWidthHeight(s_designing[0].length, s_designing.length)
	const cellWH = 'style="width: ' + cellWidthHeight + 'vmax; height: ' + cellWidthHeight + 'vmax"'

	output.push("<TABLE HEIGHT=0>")
	for (var y = 0; y < s_designing.length; ++ y)
	{
		output.push("<TR>")
		for (var x = 0; x < s_designing[y].length; ++ x)
		{
			output.push('<TD id="designCell.' + x + '.' + y + '" ' + cellWH + ' onDragStart="return false" onMouseOver="NonoDesignMouseOverGrid(' + x + ',' + y + ')" onContextMenu="return false""></TD>')
		}
		output.push("</TR>")
	}
	output.push("</TABLE>")

	controls.push("<P ID=diffHere></P>")
	controls.push('<P><SELECT ID="designMode">')

	for (var modeName of Object.keys(kDesignModes))
	{
		controls.push('<OPTION>' + modeName + '</OPTION>')
	}

	controls.push('</SELECT></P>')
	controls.push(BuildButtons(kDesignerButtons))
	return {content:controls.join(''), side:output.join(''), name:"Puzzle Designer", subtitle:s_designing[0].length + " x " + s_designing.length, exitURL:"SetHash('Design')", exitName:"BACK", thenCall:DesignerBegin}
}

function DesignerBegin()
{
	for (var y in s_designing)
	{
		for (var x in s_designing[0])
		{
			const elem = GetElement("designCell." + x + "." + y)
			elem.gridX = x
			elem.gridY = y
			elem.onmousedown = NonoDesignMouseDown
		}
	}
	
	document.onmouseup = NonoDesignMouseUp

	DesignerShowSolvability()
}

function DesignerSave()
{
	alert(NonoEncodePuzzle(s_designing))
}

function DesignToPlay()
{
	const encoded = NonoEncodePuzzle(s_designing)
	
	if (encoded)
	{
		SetHash('Custom', encoded)
	}
}

function DesignerInv()
{
	for (var y in s_designing)
	{
		for (var x in s_designing[0])
		{
			s_designing[y][x] = s_cycleDesigner[s_designing[y][x]]
		}
	}
	
	DesignerShowSolvability()
}

function DesignerClear()
{
	for (var y in s_designing)
	{
		for (var x in s_designing[0])
		{
			s_designing[y][x] = " "
		}
	}
	
	DesignerShowSolvability()
}

function RedoDesigner()
{
	const encoded = NonoEncodePuzzle(s_designing)
	
	if (encoded)
	{
		SetHash('DesignCustom', encoded)
	}
}

function DesignerTrim()
{
	var bDidSomething = false

	while (s_designing.length > kMinHeight && ! s_designing[0].includes('1'))
	{
		s_designing.shift()
		bDidSomething = true
	}

	while (s_designing.length > kMinHeight && ! s_designing[s_designing.length - 1].includes('1'))
	{
		s_designing.pop()
		bDidSomething = true
	}

	while (s_designing[0].length > kMinWidth && ! GetColumnFromGrid(s_designing, 0).includes('1'))
	{
		s_designing.forEach(row => row.shift())
		bDidSomething = true
	}

	while (s_designing[0].length > kMinWidth && ! GetColumnFromGrid(s_designing, s_designing[0].length - 1).includes('1'))
	{
		s_designing.forEach(row => row.pop())
		bDidSomething = true
	}

	if (bDidSomething)
	{
		RedoDesigner()
	}
}

function NonoDesignMouseOverGrid(x, y)
{
	if (s_autoPaint && s_designing[y][x] != s_autoPaint)
	{
		s_designing[y][x] = s_autoPaint
		GetElement('designCell.' + x + '.' + y).bgColor = (s_autoPaint == '1') ? '#222222' : '#DDDDDD'
	}
}

function NonoDesignMouseUp()
{
	if (s_autoPaint)
	{
		s_autoPaint = null
		DesignerShowSolvability()
	}
}

function NonoDesignMouseDown(e)
{
	if (! s_autoPaint)
	{
		const {target} = e
		const func = kDesignModes[GetElement("designMode").value]
		func(target.gridX, target.gridY)
	}
	
	return false
}

function DesignerShowSolvability()
{
	console.time("SolveForDesignerRowsFirst")
	var howDidItFail = SolveForDesigner(s_designing)
	console.timeEnd("SolveForDesignerRowsFirst")

	var difficulty = howDidItFail.difficulty
	
	if (difficulty !== undefined)
	{
		console.time("SolveForDesignerColsFirst")
		difficulty += SolveForDesigner(s_designing, true).difficulty
		console.timeEnd("SolveForDesignerColsFirst")

		GetElement("diffHere").innerHTML = "Difficulty: <B>" + difficulty + "</B>"
		s_designCanBeSolved = (difficulty > 0)
	}
	else
	{
		GetElement("diffHere").innerHTML = "Difficulty: <B>unsolvable</B>"
		s_designCanBeSolved = false
	}
	
	EnableButtons()
	
	for (var y in s_designing)
	{
		const row = s_designing[y]
		for (var x in row)
		{
			const elem = GetElement('designCell.' + x + '.' + y)
			if (row[x] == '1')
			{
				elem.bgColor = (howDidItFail[y][x] == ' ') ? '#660000' : '#222222'
			}
			else
			{
				elem.bgColor = (howDidItFail[y][x] == ' ') ? '#EECCCC' : '#DDDDDD'
			}
		}
	}
}