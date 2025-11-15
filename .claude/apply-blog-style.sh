#!/bin/bash

# This script applies the standardized Cursor-style blog template to all tinkering posts
# It extracts content and wraps it in the new template

STYLE_TEMPLATE='    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: '"'"'Inter'"'"', -apple-system, BlinkMacSystemFont, '"'"'Segoe UI'"'"', sans-serif;
            background: #e8e8e8;
            color: #222222;
            line-height: 1.5;
            padding: 50px 20px 80px;
        }

        a { color: inherit; }

        .container {
            max-width: 700px;
            margin: 0 auto;
        }

        .back-link {
            display: inline-block;
            color: #666666;
            text-decoration: none;
            font-size: 12px;
            margin-bottom: 30px;
            transition: color 0.2s;
        }

        .back-link:hover {
            color: #000000;
        }

        h1 {
            font-size: 36px;
            font-weight: 400;
            margin-bottom: 24px;
            line-height: 1.1;
            color: #000000;
        }

        h2 {
            font-size: 22px;
            font-weight: 400;
            margin-top: 36px;
            margin-bottom: 14px;
            color: #000000;
        }

        h3 {
            font-size: 16px;
            font-weight: 600;
            margin-top: 24px;
            margin-bottom: 10px;
            color: #000000;
        }

        h4 {
            font-size: 14px;
            font-weight: 600;
            margin-top: 18px;
            margin-bottom: 8px;
            color: #000000;
        }

        p {
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 14px;
            color: #222222;
        }

        ul, ol {
            margin-left: 18px;
            margin-bottom: 14px;
        }

        li {
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 5px;
            color: #222222;
        }

        strong {
            font-weight: 600;
        }

        code {
            font-family: '"'"'SF Mono'"'"', '"'"'Monaco'"'"', '"'"'Consolas'"'"', monospace;
            background: #f5f0e8;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            color: #333333;
        }

        pre {
            background: #f5f0e8;
            border-radius: 8px;
            padding: 14px 16px;
            overflow-x: auto;
            margin: 14px 0;
            border: 1px solid #e8e0d5;
        }

        pre code {
            font-family: '"'"'SF Mono'"'"', '"'"'Monaco'"'"', '"'"'Consolas'"'"', monospace;
            font-size: 11px;
            line-height: 1.4;
            color: #333333;
            background: none;
            padding: 0;
        }

        @media (max-width: 768px) {
            body {
                padding: 40px 16px 60px;
            }

            h1 {
                font-size: 28px;
            }

            h2 {
                font-size: 20px;
            }

            p, li {
                font-size: 13px;
            }

            pre {
                padding: 12px 14px;
            }

            pre code {
                font-size: 10px;
            }
        }
    </style>'

echo "Style template ready for application"
