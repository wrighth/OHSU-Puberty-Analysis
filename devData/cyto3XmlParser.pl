open INFILE, shift;
while(<INFILE>)
{
    $line = $_;
    if($line =~ /node id=/)
    {
      #print $line.
	$line =~ /(label=".+?")/;
	$label = $1;
	$label =~ s/"//g;
	$label =~ s/label=//g;
  @tokenz = split(/_/, $label);
  $label = @tokenz[0];
    }
    elsif($line =~ /graphics width/)
    {
      #print $line;
	$line =~ /(x="-?[0-9]+)/;
	$x = $1;
	$x =~ s/x="//;
	$line =~ /(y="-?[0-9]+)/;
	$y = $1;
	$y =~ s/y="//g;
	print $label . "," . $x . "," . $y . "\n";	
    }
}
