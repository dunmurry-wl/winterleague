input_file = "input.txt"
output_file = "output.csv"
fixed_date = "2026/03/28"

with open(input_file, "r", encoding="utf-8") as f:
    # Remove empty lines and strip whitespace
    lines = [line.strip() for line in f if line.strip()]

rows = []

for i in range(0, len(lines), 5):
    if i + 3 >= len(lines):
        # Skip incomplete record
        continue

    name = lines[i + 1]
    score = lines[i + 3]

    rows.append(f"{name},{score},{fixed_date}")

with open(output_file, "w", encoding="utf-8") as f:
    f.write("Name,Score,Date\n")  # header
    f.write("\n".join(rows))

print("CSV file created:", output_file)