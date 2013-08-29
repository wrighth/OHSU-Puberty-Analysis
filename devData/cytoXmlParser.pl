open INFILE, shift;
while(<INFILE>)
{
    $line = $_;
    if($line =~ /node label/)
    {
	$line =~ /(label=".+?")/;
	$label = $1;
	$label =~ s/"//g;
	$label =~ s/label=//g;
    }
    elsif($line =~ /graphics type/)
    {
	$line =~ /(x="[0-9]+)/;
	$x = $1;
	$x =~ s/x="//;
	$line =~ /(y="[0-9]+)/;
	$y = $1;
	$y =~ s/y="//g;
	print $label . "," . $x . "," . $y . "\n";	
    }
}
