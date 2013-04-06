# Open file in write mode and write 5 lines
with open("file.txt", "w") as f:
    for i in range(5):
        f.write("Line {0}\n".format(i + 1))


# Open file in read-only mode and read one line at the time
with open('file.txt') as f:
    for line in f:
        print(line.rstrip())
