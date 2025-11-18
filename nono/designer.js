var s_designing = null

const s_cycleDesigner = {[' ']:'1', ['1']:' '}

const kIconAdd = "&#x2795;" // "&#x1F195;"
const kIconTrash = "&#x1F5D1;&#xFE0F;"

const kDesignModes =
{
	["Draw"]:(x,y) =>
	{
		s_designing[y][x] = s_cycleDesigner[s_designing[y][x]]
		DesignerShowSolvability()
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
	const cellWidthHeight = CalcCellWidthHeight(s_designing[0].length, s_designing.length)
	const cellWH = 'width="' + cellWidthHeight + '" height="' + cellWidthHeight + '"'

	output.push("<TABLE>")
	for (var y = 0; y < s_designing.length; ++ y)
	{
		output.push("<TR>")
		for (var x = 0; x < s_designing[y].length; ++ x)
		{
			output.push('<TD id="gridCell' + x + '.' + y + '" ' + cellWH + ' onClick="ClickGridDesigner(' + x + ',' + y + ')"></TD>')
		}
		output.push("</TR>")
	}
	output.push("</TABLE><P ID=diffHere></P>")
	output.push('<SELECT ID="designMode">')

	for (var modeName of Object.keys(kDesignModes))
	{
		output.push('<OPTION>' + modeName + '</OPTION>')
	}

	output.push('</SELECT> ')
	output.push('<BUTTON onClick="DesignerSave()">SAVE</BUTTON> ')
	output.push('<BUTTON onClick="DesignerTrim()">TRIM</BUTTON> ')
	output.push('<BUTTON onClick="DesignerInv()">INVERT</BUTTON> ')
	output.push('<BUTTON onClick="DesignerClear()">CLEAR</BUTTON> ')
	output.push('<BUTTON onClick="DesignToPlay()">PLAY</BUTTON>')
	return {content:output.join(''), name:s_designing[0].length + " x " + s_designing.length, exitURL:"SetHash('Design')", exitName:"BACK", thenCall:DesignerShowSolvability}
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

function ClickGridDesigner(x, y)
{
	const func = kDesignModes[GetElement("designMode").value]
	func(x, y)
}

function DesignerShowSolvability()
{
	var howDidItFail = SolveForDesigner(s_designing)
	var difficulty = howDidItFail.difficulty
	
	if (difficulty !== undefined)
	{
		difficulty += SolveForDesigner(s_designing, true).difficulty
		GetElement("diffHere").innerHTML = "Difficulty: <B>" + difficulty + "</B>"
	}
	else
	{
		GetElement("diffHere").innerHTML = "Difficulty: <B>unsolvable</B>"
	}
	
	console.log("Total difficulty = " + difficulty)
	
	for (var y in s_designing)
	{
		const row = s_designing[y]
		for (var x in row)
		{
			const elem = GetElement('gridCell' + x + '.' + y)
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