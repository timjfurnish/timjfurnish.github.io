var s_wtSettings = new Object()

function WTSetOption(name, value)
{
	s_wtSettings[name] = value
}

WTSetOption('gameName', 'The Flywheel')
WTSetOption('byline', 'by <A HREF="/" STYLE="text-decoration:none"><Font color="#77799">Tim Furnish</FONT></A>')
WTSetOption('linkStart', "b")
WTSetOption('linkStartVisited', "")
WTSetOption('defaultPrefix', "You are in the")
WTSetOption('initialRoom', "lounge")
WTSetOption('initialText', "[STATE:garden=air]You wake up on the {sofa} in a small {lounge}. Your {head} throbs and pounds and your {muscles} ache.")
WTSetOption('initialTab', "OPTIONS")
WTSetOption('welcomeBack', "<BIG><font color=white>Welcome back to <B>The Flywheel</B>!</font></BIG>")
WTSetOption('welcome', "<BIG><font color=white>Welcome to <B>The Flywheel</B>!</font></BIG>")
WTSetOption('introHelpPrompt', "<SMALL>If you need help at any time then click the word HELP at the bottom of the screen.</SMALL>")
WTSetOption('introText', "<B>Who are you?<BR>Where are you?<BR>Why are you there?<BR>How do you get out?</B><P>Explore the area, tackle the puzzles and solve the mystery! Are you ready?")
WTSetOption('storagePrefix', 'flywheel_')
WTSetOption('font', 'font face="Arial"')
WTSetOption('headerFont', 'font face="Arial" color="#444466"')
WTSetOption('align', 'center')

// Item colours
WTSetOption('colourRoom', "#CCFFCC")
WTSetOption('colourCombine', "#FFFFBB")
WTSetOption('colourHeld', "#FFCCFF")
WTSetOption('colourDefault', "#EEFFFF")

// Panel
WTSetOption('panelGradient', "linear-gradient(#777799, #333355)")
WTSetOption('panelTextCol', '#FFFFFF')
WTSetOption('panelTabCol', '#CCDDFF')
WTSetOption('panelTabStyleOn', 'text-shadow: 2px 2px #333355; color: #FFFFFF')

// Buttons
WTSetOption('buttonGradient', "linear-gradient(#333355, #777799)")
