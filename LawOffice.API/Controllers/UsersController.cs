using LawOffice.Application.Common.Security;
using LawOffice.Application.DTOs.Users;
using LawOffice.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LawOffice.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [Authorize(Policy = Permissions.Users.View)]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListDto>>> GetUsers()
    {
        return Ok(await _userService.GetAllUsersAsync());
    }

    [Authorize(Policy = Permissions.Users.View)]
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDetailDto>> GetUser(Guid id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [Authorize(Policy = Permissions.Users.View)]
    [HttpGet("permissions")]
    public async Task<ActionResult<List<string>>> GetAvailablePermissions()
    {
        return Ok(await _userService.GetAvailablePermissionsAsync());
    }

    [Authorize(Policy = Permissions.Users.View)]
    [HttpGet("roles")]
    public async Task<ActionResult<List<RolePermissionsDto>>> GetRolesWithPermissions()
    {
        return Ok(await _userService.GetRolesWithPermissionsAsync());
    }

    [Authorize(Policy = Permissions.Users.Create)]
    [HttpPost("roles")]
    public async Task<ActionResult<RolePermissionsDto>> CreateRole([FromBody] CreateRoleDto dto)
    {
        try
        {
            var role = await _userService.CreateRoleAsync(dto);
            return Ok(role);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = Permissions.Users.Update)]
    [HttpPut("roles/{roleName}/permissions")]
    public async Task<IActionResult> UpdateRolePermissions(string roleName, [FromBody] UpdateRolePermissionsDto dto)
    {
        var result = await _userService.UpdateRolePermissionsAsync(roleName, dto.Permissions);
        if (!result) return NotFound();
        return NoContent();
    }

    [Authorize(Policy = Permissions.Users.Delete)]
    [HttpDelete("roles/{roleName}")]
    public async Task<IActionResult> DeleteRole(string roleName)
    {
        try
        {
            var result = await _userService.DeleteRoleAsync(roleName);
            if (!result) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = Permissions.Users.Create)]
    [HttpPost]
    public async Task<ActionResult<UserDetailDto>> CreateUser(CreateUserDto dto)
    {
        var user = await _userService.CreateUserAsync(dto);
        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
    }

    [Authorize(Policy = Permissions.Users.Update)]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(Guid id, UpdateUserDto dto)
    {
        if (id != dto.Id) return BadRequest();
        var result = await _userService.UpdateUserAsync(dto);
        if (!result) return NotFound();
        return NoContent();
    }

    [Authorize(Policy = Permissions.Users.Delete)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var result = await _userService.DeleteUserAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpGet("lawyers")]
    public async Task<ActionResult<IEnumerable<UserListDto>>> GetLawyers()
    {
        return Ok(await _userService.GetLawyersAsync());
    }
}
