using System.Text.Json;
using api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace api.Data;

public class Seed
{
    // The UserManager provides access to the database (and takes the place of the DataContext)
    public static async Task SeedUsers(UserManager<AppUser> userManager, RoleManager<AppRole> roleManager)
    {
        if (await userManager.Users.AnyAsync()) return;

        var userData = await File.ReadAllTextAsync("Data/UserSeedData.json");

        var options = new JsonSerializerOptions{PropertyNameCaseInsensitive = true};

        var users = JsonSerializer.Deserialize<List<AppUser>>(userData, options);

        if (users == null) return;

    //  The 'new()' is syntactic sugar for typing 'new AppRole'.
        var roles = new List<AppRole>
        {
            new() {Name = "Member"},
            new() {Name = "Admin"},
            new() {Name = "Moderator"}
        };

        foreach (var role in roles)
        {
            await roleManager.CreateAsync(role);
        }

    /*
        The password needs to be a complex password of at least 6 characters in order
        for the userManager.CreateAsync to work.  The userManager.CreateAsync saves the user
        and password into the database; so I don't need an additional line of code
        specifying 'await context.SaveChangesAsync()'
    */
        foreach (var user in users)
        {
            user.UserName = user.UserName!.ToLower();            
            await userManager.CreateAsync(user, "Pa$$w0rd");

    //  When a new user is created / registered, the new user
    //  will also be given the role of "Member".
            await userManager.AddToRoleAsync(user, "Member");
        }

    //  I've set the Gender as an empty string to prevent the admin from showing up
    //  in the results (i.e. the list of Members) that are returned to the client
        var admin = new AppUser
        {
            UserName = "admin",
            KnownAs = "Admin",
            Gender = "",
            City = "",
            Country = ""
        };

        await userManager.CreateAsync(admin, "Pa$$w0rd");
        await userManager.AddToRolesAsync(admin, ["Admin", "Moderator"]);

    }
}
