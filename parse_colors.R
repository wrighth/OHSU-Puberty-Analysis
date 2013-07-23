suppressWarnings(suppressMessages(library(gplots)));
retcols <- function(expr, nbreaks)
{
	rg <- greenred(nbreaks);
	i <- 1;
	ret <- 0;
	maxr <- max(expr[,1]);
	expr[,1] <- expr[,1]/maxr;
	medr <- median(expr[,1]);
	downreg <- medr*10/(floor(nbreaks/2));
	upreg <- (1-medr) * 10/(floor(nbreaks/2));
	while(i <= dim(expr)[1])
	{
		if(expr[i,1] < medr)
		{
			ret[i] <- rg[ceiling(expr[i,1] * 10/downreg)];
		}
		else
		{
			ret[i] <- rg[floor(nbreaks/2) + ceiling((expr[i,1] - medr) * 10/upreg)];
		}
		i <- i + 1;
	}
	return(cbind(ret, tolower(expr[,2])));
}
args <- commandArgs(TRUE)
expr <- read.table(args[1], sep=",", header=FALSE, colClasses=c("numeric", "character"));
write.table(retcols(expr, as.numeric(args[2])), sep="_", row.names=FALSE, col.names=FALSE, quote=FALSE);

q("no");

