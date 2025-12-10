# Gmail Label Color Support

Gmail API supports colored labels through the `color` property when creating labels.

## Color Format

Gmail accepts colors in two formats:

### 1. Hexadecimal Colors
Standard hex color codes (e.g., `#FF0000` for red)

### 2. Gmail Color Palette
Gmail provides predefined color palette values that work across all platforms:

```json
{
  "backgroundColor": "#000000",  // Black
  "textColor": "#FFFFFF"          // White
}
```

## Common Gmail Palette Colors

| Background Color | Text Color | Description |
|-----------------|------------|-------------|
| `#000000` | `#FFFFFF` | Black background, white text |
| `#434343` | `#FFFFFF` | Dark gray background, white text |
| `#666666` | `#FFFFFF` | Gray background, white text |
| `#999999` | `#000000` | Light gray background, black text |
| `#CCCCCC` | `#000000` | Very light gray background, black text |
| `#EFEFEF` | `#000000` | Almost white background, black text |
| `#F3F3F3` | `#000000` | White background, black text |
| `#FB4C2F` | `#FFFFFF` | Red background, white text |
| `#FFAD47` | `#000000` | Orange background, black text |
| `#FAD165` | `#000000` | Yellow background, black text |
| `#16A766` | `#FFFFFF` | Green background, white text |
| `#43D692` | `#000000` | Light green background, black text |
| `#4A86E8` | `#FFFFFF` | Blue background, white text |
| `#A479E2` | `#FFFFFF` | Purple background, white text |
| `#F691B3` | `#000000` | Pink background, black text |
| `#F6C5BE` | `#000000` | Light pink background, black text |
| `#CCA6AC` | `#000000` | Dusty rose background, black text |
| `#CABDBF` | `#000000` | Light brown background, black text |
| `#C2C2C2` | `#000000` | Silver background, black text |
| `#E07798` | `#FFFFFF` | Magenta background, white text |

## Usage in API

When creating a label via Gmail API:

```javascript
{
  "name": "Important",
  "color": {
    "backgroundColor": "#FB4C2F",  // Red
    "textColor": "#FFFFFF"          // White
  },
  "labelListVisibility": "labelShow",
  "messageListVisibility": "show"
}
```

## Database Schema

The `rules` table stores color preferences:
- `label_bg_color` VARCHAR(50) - Background color (hex code)
- `label_text_color` VARCHAR(50) - Text color (hex code)

When a label is created from a rule, these colors are applied automatically.

## Notes

- Colors are only applied when a new label is created
- Existing labels keep their current colors
- Gmail built-in labels (like INBOX, STARRED) cannot have custom colors
- If no color is specified, Gmail uses default gray/white colors
