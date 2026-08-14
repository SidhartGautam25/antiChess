from PIL import Image

def print_ascii_tile(filename):
    img = Image.open(filename)
    w, h = img.size
    print(f"=== ASCII REPRESENTATION OF {filename} ({w}x{h}) ===")
    
    # Scale down slightly to fit the terminal (e.g., 55x55 -> 55x28)
    # We can print every pixel horizontally, but every 2nd pixel vertically to adjust for line height
    for y in range(0, h, 2):
        line = ""
        for x in range(w):
            r, g, b = img.getpixel((x, y))[:3]
            
            # Categorize color:
            # Gold/yellow: r > 180, g > 130, b < 100
            if r > 180 and g > 130 and b < 100:
                line += "#" # Gold/Yellow
            # White-ish / Light: r > 200, g > 200, b > 200
            elif r > 200 and g > 200 and b > 200:
                line += "o" # Light text/etc
            # Dark beige / background tile3: #9E8875
            elif r > 120 and g > 100 and b > 80:
                line += "." # Wood background
            else:
                line += " " # Dark/other
        print(line)

print_ascii_tile('tile_4_0.png')
print_ascii_tile('tile_7_0.png')
