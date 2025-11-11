var s_designing = null

const s_cycleDesigner = {[' ']:'1', ['1']:' '}

function SetUpPreDesigner()
{
	const output = []
	output.push('<BUTTON onClick="SetUpDesigner(15,25)">15 x 25</BUTTON> ')
	output.push('<BUTTON onClick="SetUpDesigner(20,20)">20 x 20</BUTTON> ')
	output.push('<BUTTON onClick="SetUpDesigner(25,15)">25 x 15</BUTTON><P><B>Or start from one of these!</B><BR>')
	output.push(BuildButtonsForPuzzles("SetUpDesignerFromID"))

	Deploy('Puzzle Designer', output.join('') + '</P><P><B>Or enter a puzzle code here!</B><BR><INPUT ID="puzzleData" TYPE=text SIZE=80 ONCHANGE="SetUpDesignerFromTextBox()"></P>')
}

function SetUpDesignerFromID(myID)
{
	const data = NonoDecodePuzzle(s_puzzles[myID].data)

	if (data)
	{
		SetUpDesignerForGrid(data)
	}
}

function SetUpDesignerFromTextBox(myID)
{
	const {value} = GetElement("puzzleData")
	const data = NonoDecodePuzzle(value)

	if (data)
	{
		SetUpDesignerForGrid(data)
	}
	else
	{
		alert("Invalid puzzle definition! Sorry!")
	}
}

function SetUpDesigner(width, height)
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
	
	SetUpDesignerForGrid(emptyGrid)
}

function SetUpDesignerForGrid(grid)
{
	if (! Array.isArray(grid))
	{
		console.warn("Expected an array")
		return
	}

	s_designing = grid
	RebuildDesignScreen()
}

function RebuildDesignScreen()
{	
	const output = []
	const cellWH = 'width="' + s_cellWidthHeight + '" height="' + s_cellWidthHeight + '"'

	output.push("<TABLE>")
	for (var y = 0; y < s_designing.length; ++ y)
	{
		output.push("<TR align=center>")
		for (var x = 0; x < s_designing[y].length; ++ x)
		{
			const col = (s_designing[y][x] == ' ') ? '#DDDDDD' : '#222222'
			output.push('<TD id="gridCell' + x + '.' + y + '" ' + cellWH + ' onClick="ClickGridDesigner(' + x + ',' + y + ')" BGCOLOR="' + col + '"></TD>')
		}
		output.push("</TR>")
	}
	output.push("</TABLE><BR>")
	output.push('<BUTTON onClick="DesignerSave()">SAVE</BUTTON> ')
	output.push('<BUTTON onClick="DesignerTrim()">TRIM</BUTTON> ')
	output.push('<BUTTON onClick="DesignerInv()">INVERT</BUTTON> ')
	output.push('<BUTTON onClick="SetUpDesigner(' + s_designing[0].length + ', ' + s_designing.length + ')">CLEAR</BUTTON>')
	Deploy('Puzzle Designer', output.join(''))
}

function DesignerSave()
{
	alert(NonoEncodePuzzle(s_designing))
}

function DesignerInv()
{
	for (var y in s_designing)
	{
		for (var x in s_designing[0])
		{
			ClickGridDesigner(x, y)
		}
	}
}

function DesignerTrim()
{
	var bDidSomething = false

	while (s_designing.length > 5 && ! s_designing[0].includes('1'))
	{
		s_designing.shift()
		bDidSomething = true
	}

	while (s_designing.length > 5 && ! s_designing[s_designing.length - 1].includes('1'))
	{
		s_designing.pop()
		bDidSomething = true
	}

	while (s_designing[0].length > 5 && ! GetColumnFromGrid(s_designing, 0).includes('1'))
	{
		s_designing.forEach(row => row.shift())
		bDidSomething = true
	}

	while (s_designing[0].length > 5 && ! GetColumnFromGrid(s_designing, s_designing[0].length - 1).includes('1'))
	{
		s_designing.forEach(row => row.pop())
		bDidSomething = true
	}

	if (bDidSomething)
	{
		RebuildDesignScreen()
	}
}

function ClickGridDesigner(x, y)
{
	if (! s_autoSolveData)
	{
		const newContents = s_cycleDesigner[s_designing[y][x]]
		const elem = GetElement('gridCell' + x + '.' + y)
		
		if (newContents === undefined || newContents.length != 1)
		{
			console.warn("newContents='" + newContents + "' for " + x + ", " + y)
		}

		s_designing[y][x] = newContents
		
		if (elem)
		{
			if (newContents == '1')
			{
				elem.bgColor = '#222222'
			}
			else
			{
				elem.bgColor = '#DDDDDD'
			}
		}
	}
}
