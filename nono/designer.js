var s_designing = null
var s_blockPlayAndShare = null

const s_cycleDesigner = {[' ']:'1', ['1']:' '}

const kIconAdd = "&#x2795;" // "&#x1F195;"
const kIconTrash = "&#x1F5D1;&#xFE0F;"

const kDesignModes =
{
	["Draw"]:(x,y) =>
	{
		s_lastSetup.paint = s_cycleDesigner[s_designing[y][x]]
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

const kDesignerButtons = {TRIM:"DesignerTrim()", INVERT:"DesignerInv()", CLEAR:"DesignerClear()", PLAY:"DesignToPlay()"}

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
	controls.push('<P><SELECT ID="designMode" ONCHANGE="s_lastSetup.designerEditMode = GetElement(\'designMode\').value">')
	const selectThisMode = s_lastSetup?.designerEditMode ?? "Draw"
	for (var modeName of Object.keys(kDesignModes))
	{
		const openTag = (modeName == selectThisMode) ? "<OPTION SELECTED>" : "<OPTION>"
		controls.push(openTag + modeName + '</OPTION>')
	}

	controls.push('</SELECT></P>')
	controls.push(BuildButtons(kDesignerButtons))
	return {content:controls.join(''), designerEditMode:selectThisMode, shareAs:"Nonography: Custom Puzzle", shareHash:MakeDesignShareHash, side:output.join(''), name:"Puzzle Designer", subtitle:s_designing[0].length + " x " + s_designing.length, exitCalls:"SetHash('Design')", exitName:"BACK", thenCall:DesignerBegin}
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
	
	onmouseup = NonoDesignMouseUp

	DesignerShowSolvability()
}

function DesignToPlay()
{
	const encoded = NonoEncodePuzzle(s_designing)
	
	if (encoded)
	{
		SetHash('Custom', encoded)
	}
}

function MakeDesignShareHash()
{
	const encoded = NonoEncodePuzzle(s_designing)
	return encoded ? "Custom=" + encoded : undefined
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
	if (s_lastSetup.paint && s_designing[y][x] != s_lastSetup.paint)
	{
		s_designing[y][x] = s_lastSetup.paint
		GetElement('designCell.' + x + '.' + y).bgColor = (s_lastSetup.paint == '1') ? '#222222' : '#DDDDDD'
	}
}

function NonoDesignMouseUp()
{
	if (s_lastSetup.paint)
	{
		delete s_lastSetup.paint
		DesignerShowSolvability()
	}
}

function NonoDesignMouseDown(e)
{
	if (! s_lastSetup.paint)
	{
		const {target} = e
		const func = kDesignModes[s_lastSetup.designerEditMode]
		if (func)
		{
			func(target.gridX, target.gridY)
		}
		else
		{
			console.warn("No designer mouse down func, s_lastSetup.designerEditMode=" + s_lastSetup.designerEditMode)
		}
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
		s_blockPlayAndShare = !difficulty
	}
	else
	{
		GetElement("diffHere").innerHTML = "Difficulty: <B><font color=#990000>unsolvable</font></B>"
		s_blockPlayAndShare = true
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