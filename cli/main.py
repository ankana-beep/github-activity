import requests
import typer

app = typer.Typer()

API = "http://127.0.0.1:8000/activity"


@app.command()
def get(username: str):

    response = requests.get(f"{API}/{username}")

    data = response.json()

    print(f"\nGitHub Activity for {username}\n")

    for event, count in data.items():
        print(f"{event} → {count} times")


if __name__ == "__main__":
    app()