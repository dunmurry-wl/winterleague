namespace Dunmurry.WinterLeague.RoundImporter;

public static class EnumerableExtensions
{
    public static DateTime? MedianDate(this IEnumerable<DateTime> source)
    {
        if (source == null) throw new ArgumentNullException(nameof(source));

        var ordered = source.OrderBy(d => d).ToList();
        int count = ordered.Count;
        if (count == 0) return null;

        if (count % 2 == 1)
            return ordered[count / 2];

        var mid1 = ordered[(count / 2) - 1];
        var mid2 = ordered[count / 2];
        return new DateTime((mid1.Ticks + mid2.Ticks) / 2);
    }
}