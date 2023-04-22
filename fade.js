var g_fadeMe = 0
var g_trig = {}
var g_stillGoing = true

function FadeGetNextName()
{
	return 'fadeMe' + (g_fadeMe ++)
}

function StartFading()
{
	g_fadeMe = 0
	FadeStartNext()
	setTimeout(TickFade, 20)
}

function FadeStartNext()
{
	const name = 'fadeMe' + g_fadeMe
	const elem = document.getElementById(name)

	if (elem)
	{
		g_trig[name] = {style:elem.style, op:0}
		++ g_fadeMe
		setTimeout(FadeStartNext, 250)
	}
	else
	{
		g_stillGoing = false
	}
}

function TickFade()
{
	var didSomething = false
	for (var [k,v] of Object.entries(g_trig))
	{
		v.op += 0.015
		if (v.op >= 1)
		{
			v.style.opacity = 1
			delete g_trig[k]
		}
		else
		{
			v.style.opacity = v.op
			didSomething = true
		}
	}
	
	if (g_stillGoing || didSomething)
	{
		setTimeout(TickFade, 20)
	}
}
